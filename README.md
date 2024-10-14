# User Posts Backend

## Description

This is a backend application that provides a RESTful API for user posts.

## Technologies

- Node.js + Express.js + TypeScript
- PostgreSQL
- AWS S3

## Prerequisites

- Node.js (v20)
- PostgreSQL
- AWS account
- pnpm

## Installation

- Clone the repository
- Run `pnpm install` to install the dependencies
- Create a `.env` file in the root directory and add the following environment variables:
  - `PORT` - the port the server will run on
  - `POSTGRES_HOST` - the host of the PostgreSQL database
  - `POSTGRES_PORT` - the port of the PostgreSQL database
  - `POSTGRES_DB` - the name of the PostgreSQL database
  - `POSTGRES_USER` - the user of the PostgreSQL database
  - `POSTGRES_PASSWORD` - the password of the PostgreSQL database
  - `TOKEN_SECRET` - the secret used to sign JWT tokens
  - `SALT_ROUNDS` - the number of rounds used to hash passwords with bcrypt
  - `AWS_REGION` - the region of the AWS S3 bucket
  - `AWS_BUCKET_NAME` - the name of the AWS S3 bucket
- Run the `schema.sql` file to create the database schema
- Run `pnpm dev` to start the development server

## API

- users
  - `GET` `/users/:id` - returns the user with the given id
  - `POST` `/users` - creates a new user
  - `POST` `/users/authenticate` - logs in the user and returns a JWT token
  - `DELETE` `/users/:id` - deletes the user with the given id
  - `PATCH` `/users/:id` - updates the user with the given id
  - `PATCH` `/users/:id/password` - updates the password of the user with the given id
  - `POST` `/users/:id/image` - uploads an image for the user with the given id
- posts
  - `GET` `/posts` - returns all the user posts
  - `POST` `/posts` - creates a new post for the user
  - `PATCH` `/posts/:id` - updates the post with the given id
  - `DELETE` `/posts/:id` - deletes the post with the given id
