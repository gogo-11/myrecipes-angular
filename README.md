# MyrecipesAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Local browser test

Start the Spring Boot API in a separate terminal from `D:\JAVA\test\myrecipe` with its existing database configuration. Its checked-in configuration uses port 8081, so override it to match this frontend's proxy:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8080"
```

Then, from this frontend directory, run:

```powershell
npm install
npm start
```

Open `http://localhost:4200/`. The Angular development server proxies `/api/**` to `http://localhost:8080`; the app requests `/api/v1/recipes?page=0&size=6` and uses the same proxy for recipe images. Run `npm run build` to check the production bundle.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
