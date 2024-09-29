# Article API

## Description

This is an article management application that allows users to perform various operations on articles. Users can save articles to the database, retrieve existing articles, edit their content, and delete articles as needed.

### Technologies Used

- **Nest.js**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: A superset of JavaScript that provides static typing, making the code more robust and maintainable.
- **TypeORM**: An ORM (Object-Relational Mapping) library that helps manage database interactions using TypeScript.
- **Redis**: An in-memory data structure store, used as a database, cache, and message broker.
- **OpenAPI**: A specification for building APIs, allowing for clear documentation and easy integration.
- **Jest**: A testing framework for JavaScript applications, used for unit and integration testing.

## OpenAPI Documentation

OpenAPI documentation is available after the application is launched.

Example of an access link: [http://localhost:3000/api](http://localhost:3000/api)

## Contents

- [Installation](#Installation)
- [Running the app](#Running-the-app)
- [Test](#Test)
- [TypeORM Migrations](#TypeORM-Migrations)


## Installation
1. Clone the repository:
```bash
   git clone https://github.com/rybakN/test-qtimpro.git
   cd test-qtimpro
```
2. Install the dependencies:
```bash
$ npm install
```

## Running the app
**OpenAPI**: http://localhost:3000/api
```bash
# Running the app with docker-compose
$ npm run docker-compose:up

# Close the app with docker-compose
$ npm run docker-compose:down
```

```bash
# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## TypeORM Migrations

```bash
# generate migrations
npm run migration:generate

# run migrations
npm run migration:run

# revert migrations
npm run migration:revert
```