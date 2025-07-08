CAPABILITIES=CAPABILITY_IAM CAPABILITY_AUTO_EXPAND CAPABILITY_NAMED_IAM
REGION=us-east-1
PREFIX=royalty-loans
ARTIFACT_NAME=royalty-loans.zip
ARTIFACTS_BUCKET=artifacts-ow
TEMPLATE_FILE=template.yml

.deploy:
	sam deploy --template-file $(TEMPLATE_FILE) --stack-name $(STACK_NAME) --capabilities $(CAPABILITIES) --region $(REGION) --s3-bucket $(ARTIFACTS_BUCKET) --s3-prefix $(ENVIRONMENT) --parameter-overrides $(PARAMETERS) --no-fail-on-empty-changeset

deploy-stage: ENVIRONMENT=stage
deploy-stage: STACK_NAME=stage-royalty-loans-backend
deploy-stage: PARAMETERS_FILE=template-config.stage.json
deploy-stage: PARAMETERS=$(shell jq -r '.Parameters | to_entries | map("\(.key)=\(.value)") | join(" ")' $(PARAMETERS_FILE))
deploy-stage: .deploy

deploy-prod: ENVIRONMENT=prod
deploy-prod: STACK_NAME=prod-royalty-loans-backend
deploy-prod: PARAMETERS_FILE=template-config.prod.json
deploy-prod: PARAMETERS=$(shell jq -r '.Parameters | to_entries | map("\(.key)=\(.value)") | join(" ")' $(PARAMETERS_FILE))
deploy-prod: .deploy

cleanup:
	rm -rf out && \
	rm -rf ../dist && \
	rm -rf $(ARTIFACT_NAME)

royalty-loans.zip: cleanup
	npx nx run backend:esbuild && \
	mkdir -p out/node_modules && cp -r ../../../node_modules/app-root-path out/node_modules &&  \
	zip -r royalty-loans.zip out
