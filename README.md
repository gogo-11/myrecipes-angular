# MyrecipesAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Local browser test

Start the Spring Boot API in a separate terminal from `D:\JAVA\test\myrecipe` with its existing database configuration. The API and frontend proxy both use port 8081:

```powershell
.\mvnw.cmd spring-boot:run
```

Then, from this frontend directory, run:

```powershell
npm install
npm start
```

Open `http://localhost:4200/`. The Angular development server proxies `/api/**` to `http://localhost:8081`; the app requests `/api/v1/recipes?page=0&size=6` for the list and `/api/v1/recipes/{id}` for details. Recipe images use the same proxy. Run `npm run build` to check the production bundle.

## Nutrition API follow-up

The details page requests only the cached estimate with `GET /api/v1/recipes/{id}/nutrition`, after the recipe loads. The current backend requires authentication for this GET. To enable public cached reads, permit only this numeric GET route and have its controller load the recipe through `getPublicRecipeById(id)` before checking the cache. Missing or private recipes should return 404; public recipes without a cached estimate should return 204.

Keep nutrition generation separate. A future **„Изчисли хранителни стойности“** button should call `POST /api/v1/recipes/{id}/nutrition` only after an explicit click by an authenticated recipe owner or admin. Enforce ownership or admin role, public/private visibility, caching, and request limits on the server. The frontend currently makes no POST nutrition request.

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
