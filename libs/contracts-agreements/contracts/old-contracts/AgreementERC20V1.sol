// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.13;
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165CheckerUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol';
import '../interfaces/IAgreementProxy.sol';
import '../interfaces/IFeeManager.sol';
import '../interfaces/ILendingContract.sol';
import '../interfaces/IAgreementRelationsRegistry.sol';
import '../interfaces/ISplitCurrencyListManager.sol';
import './interfaces/IAgreement.sol';
import '../interfaces/IFallbackVault.sol';

contract AgreementERC20V1 is
    Initializable,
    ERC20Upgradeable,
    ERC1155HolderUpgradeable,
    IAgreement
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ISplitCurrencyListManager private splitCurrencyListManager;
    IFeeManager private feeManager;
    ILendingContract private lendingContract;
    IAgreementRelationsRegistry private agreementRelationsRegistry;
    IFallbackVault private fallbackVault;

    mapping(address => uint256) receivedFunds;
    mapping(address => uint256) withdrawnFunds;
    mapping(address => uint256) fees;
    mapping(address => uint256) feesCollected;

    uint256 private _adminCount;

    mapping(address => mapping(address => uint256)) private holderFundsCounters;
    mapping(address => bool) private admins;

    string public dataHash;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyAdmin() {
        require(
            admins[msg.sender] == true,
            'AgreementERC20: Sender must be an admin'
        );
        _;
    }

    function initialize(
        string memory _dataHash,
        Holder[] memory holders,
        address _splitCurrencyListManager,
        address _feeManager,
        address _lendingContract,
        address _agreementRelationsRegistry,
        address _fallbackVault
    ) public initializer {
        require(holders.length > 0, 'AgreementERC20: No holders');
        require(
            holders[0].isAdmin,
            'AgreementERC20: First holder must be admin'
        );

        __ERC20_init('OW Agreement', 'share');
        _setDataHash(_dataHash);
        splitCurrencyListManager = ISplitCurrencyListManager(
            _splitCurrencyListManager
        );
        feeManager = IFeeManager(_feeManager);
        lendingContract = ILendingContract(_lendingContract);
        agreementRelationsRegistry = IAgreementRelationsRegistry(
            _agreementRelationsRegistry
        );
        fallbackVault = IFallbackVault(_fallbackVault);

        for (uint256 i = 0; i < holders.length; i++) {
            _addHolder(holders[i]);
        }
    }

    function setDataHash(string memory _dataHash) public onlyAdmin {
        _setDataHash(_dataHash);
    }

    function addAdmin(address user) public onlyAdmin {
        _addAdmin(user);
    }

    function removeAdmin(address user) public onlyAdmin {
        require(
            admins[user] == true,
            'AgreementERC20: Account is not an admin'
        );
        require(_adminCount > 1, 'AgreementERC20: Cannot remove last admin');
        _adminCount--;
        admins[user] = false;
        emit AdminRemoved(user);
    }

    function claimHolderFunds(address holder, address currency) public {
        require(
            splitCurrencyListManager.currencyMap(currency) == true,
            'AgreementERC20: Currency not supported'
        );
        uint256 currentFee;
        uint256 paymentFeeDenominator;

        if (_hasUnregisteredIncome(currency)) {
            (currentFee, paymentFeeDenominator) = _registerIncome(currency);
        } else {
            (, currentFee, paymentFeeDenominator) = feeManager.getFees();
        }
        if (holderFundsCounters[currency][holder] != receivedFunds[currency]) {
            uint256 amount = ((receivedFunds[currency] -
                holderFundsCounters[currency][holder]) * balanceOf(holder)) /
                totalSupply();
            amount -= ((amount * currentFee) / paymentFeeDenominator);
            holderFundsCounters[currency][holder] = receivedFunds[currency];
            withdrawnFunds[currency] += amount;
            if (currency == splitCurrencyListManager.lendingCurrency()) {
                IERC20Upgradeable(currency).safeApprove(
                    address(lendingContract),
                    amount
                );
                try
                    lendingContract.transfer(address(this), holder, amount)
                {} catch {
                    revert('AgreementERC20: Withdrawing transfer failed');
                }
            } else if (currency == address(0)) {
                (bool holderWasPaid, ) = holder.call{value: amount}('');

                if (holderWasPaid == false) {
                    fallbackVault.registerIncomingFunds{value: amount}(holder);
                }
            } else {
                IERC20Upgradeable(currency).safeTransfer(holder, amount);
            }
            emit HolderFundsClaimed(holder, amount, currency);
        }
    }

    function collectFee(address currency) public {
        require(
            msg.sender == address(feeManager),
            'AgreementERC20: Only FeeManager can collect fee'
        );

        if (_hasUnregisteredIncome(currency)) {
            _registerIncome(currency);
        }
        uint256 availableFee = fees[currency] - feesCollected[currency];
        withdrawnFunds[currency] += availableFee;
        feesCollected[currency] += availableFee;
        if (currency == address(0)) {
            address feeCollector = payable(msg.sender);
            (bool callSucceeded, ) = feeCollector.call{value: availableFee}('');
            if (!callSucceeded) {
                fallbackVault.registerIncomingFunds{value: availableFee}(
                    feeManager.owner()
                );
            }
        } else {
            IERC20Upgradeable(currency).safeTransfer(msg.sender, availableFee);
        }
        emit FeeCollected(availableFee, currency);
    }

    function transferOwnedERC20Shares(
        IERC20Upgradeable agreement,
        address recipient,
        uint256 amount
    ) public onlyAdmin {
        agreement.safeTransfer(recipient, amount);
    }

    function transferOwnedERC1155Shares(
        IERC1155Upgradeable agreement,
        address recipient,
        uint256 amount
    ) public onlyAdmin {
        agreement.safeTransferFrom(address(this), recipient, 1, amount, '');
    }

    function isAdmin(address user) public view returns (bool) {
        return admins[user];
    }

    function getAvailableFee(address currency) public view returns (uint256) {
        (, uint256 paymentFee, uint256 paymentFeeDenominator) = feeManager
            .getFees();
        uint256 availableFee = fees[currency] - feesCollected[currency];

        if (_hasUnregisteredIncome(currency)) {
            uint256 currentBalance;
            if (currency == address(0)) {
                currentBalance = address(this).balance;
            } else {
                currentBalance = IERC20Upgradeable(currency).balanceOf(
                    address(this)
                );
            }
            uint256 newTotal = withdrawnFunds[currency] + currentBalance;
            uint256 newReceived = newTotal - receivedFunds[currency];
            return
                availableFee +
                (newReceived * paymentFee) /
                paymentFeeDenominator;
        } else {
            return availableFee;
        }
    }

    function upgrade(address implementation) public onlyAdmin {
        IAgreementProxy(address(this)).upgradeTo(implementation);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(
            !lendingContract.isCollateral(from, address(this)),
            'AgreementERC20: Agreement is used as collateral'
        );
        if (balanceOf(to) == 0 && AddressUpgradeable.isContract(to)) {
            agreementRelationsRegistry.registerChildParentRelation(to);
        }
        if (balanceOf(from) == amount && AddressUpgradeable.isContract(from)) {
            agreementRelationsRegistry.removeChildParentRelation(from);
        }
        if (from != address(0)) {
            address[] memory currencyArray = splitCurrencyListManager
                .getCurrencyArray();
            for (uint i = 0; i < currencyArray.length; i++) {
                claimHolderFunds(from, currencyArray[i]);
            }
        }
        if (to != address(0)) {
            address[] memory currencyArray = splitCurrencyListManager
                .getCurrencyArray();
            for (uint i = 0; i < currencyArray.length; i++) {
                claimHolderFunds(to, currencyArray[i]);
            }
        }
    }

    function _setDataHash(string memory _dataHash) private {
        if (keccak256(bytes(dataHash)) != keccak256(bytes(_dataHash))) {
            dataHash = _dataHash;
            emit DataHashChanged(_dataHash);
        }
    }

    function _updateFee(address currency) private returns (uint256, uint256) {
        (, uint paymentFee, uint256 paymentFeeDenominator) = feeManager
            .getFees();

        uint256 newIncome;
        if (currency == address(0)) {
            newIncome =
                (withdrawnFunds[currency] + address(this).balance) -
                receivedFunds[currency];
        } else {
            newIncome =
                (withdrawnFunds[currency] +
                    IERC20Upgradeable(currency).balanceOf(address(this))) -
                receivedFunds[currency];
        }
        uint256 newFee = (newIncome * paymentFee) / paymentFeeDenominator;
        fees[currency] += newFee;
        emit FeeAvailable(newFee, fees[currency], currency);
        return (paymentFee, paymentFeeDenominator);
    }

    function _addHolder(Holder memory holder) private {
        require(holder.balance > 0, 'AgreementERC20: Holder balance is zero');
        require(
            holder.account != address(0),
            'AgreementERC20: Holder account is zero'
        );
        require(
            balanceOf(holder.account) == 0,
            'AgreementERC20: Duplicate holder'
        );
        _mint(holder.account, holder.balance);
        if (holder.isAdmin) {
            _addAdmin(holder.account);
        }
    }

    function _addAdmin(address user) private {
        require(user != address(0), 'AgreementERC20: Invalid admin');
        require(
            admins[user] == false,
            'AgreementERC20: Account is already an admin'
        );
        admins[user] = true;
        _adminCount++;
        emit AdminAdded(user);
    }

    function _hasUnregisteredIncome(
        address currency
    ) private view returns (bool) {
        if (currency == address(0)) {
            return (receivedFunds[currency] <
                (withdrawnFunds[currency] + address(this).balance));
        } else {
            return (receivedFunds[currency] <
                (withdrawnFunds[currency] +
                    IERC20Upgradeable(currency).balanceOf(address(this))));
        }
    }

    function _registerIncome(
        address currency
    ) private returns (uint256 currentFee, uint256 paymentFeeDenominator) {
        (currentFee, paymentFeeDenominator) = _updateFee(currency);
        if (currency == address(0)) {
            receivedFunds[currency] =
                withdrawnFunds[currency] +
                address(this).balance;
        } else {
            receivedFunds[currency] =
                withdrawnFunds[currency] +
                IERC20Upgradeable(currency).balanceOf(address(this));
        }
        return (currentFee, paymentFeeDenominator);
    }

    receive() external payable {
        emit NativeCoinReceived(msg.sender, msg.value);
    }
}
