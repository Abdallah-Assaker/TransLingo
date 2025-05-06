.PHONY: run-compose stop-compose run-translator run-swagger-ui run-db clean test

# Command to run all services using docker-compose
run-compose:
	docker-compose up --build

# Command to stop all services
stop-compose:
	docker-compose down

# Command to run only the translator service
run-translator:
	docker-compose up --build translator

# Command to run only the swagger-ui service
run-swagger-ui:
	docker-compose up --build swagger-ui

# Command to run only the database service
run-db:
	docker-compose up --build db

# Command to clean up unused Docker resources
clean:
	docker system prune -f

# Command to run Playwright tests
run-playwright:
	cd translator && npx playwright test
