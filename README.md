# Cougar Electric

<img src="apps/customer/assets/cougar-electric-mascot.png" alt="Cougar Electric logo" width="120" />

Built by Agile Avengers for our CSC 190/191 senior project.

## About

This app helps customers request electrical service and find an available electrician. Customers can share their problem and location. The technician app will help electricians view requests and manage their jobs.

## How to run

Install Node.js 24 and get the Firebase `.env` settings from the team for each app folder. From the main project folder, run:

```bash
npm install
```

Customer app:

```bash
npm run web
```

Technician app:

```bash
npm run web:technician
```

Open the address shown in the terminal. Use two terminals to run both apps.

## Timeline

Our team uses Jira to divide the work into tasks and track each sprint.

| Stage | Main goals |
| --- | --- |
| September 2026 | Meet the client and write the project proposal and charter. |
| Customer app | Build accounts, issue selection, written descriptions, photos and videos, service location, and request submission. |
| Client feedback | Update the customer home page, menu, notifications, account settings, and payment screens. |
| Technician home | Set up the technician app, home page, and navigation. |
| Technician sprint | Build the jobs list, request offers, navigation screen, on-site screen, work forms, and messages, earnings, and settings. |
| CSC 191 — Spring 2027 | Connect the customer and technician workflows, add the dispatcher tools, test the system, and prepare it for release. |
| May 1, 2027 | Target date to deliver the project to the client. |

We will update our sprint dates and task progress in Jira as our group completes the work.

## Testing

Our group will add our full testing plan and results in CSC 191. We will check that:

- Customers can create accounts, sign in, and submit service requests.
- Descriptions, addresses, and attachments are saved correctly.
- Technicians can receive jobs and update their progress.
- Customers receive the correct job updates and messages.
- Users can only access information they are allowed to see.
- The apps work on supported phones and in a browser.

## Deployment

We will add our release steps in CSC 191. We will explain how we build and publish both apps, set up Firebase for our client, and update our apps after release. Our group will also record the settings and access we need to manage the live system.

## Developer instructions

We will add our full developer guide in CSC 191. For now, our group follows these steps:

- We keep our customer app files in `apps/customer`.
- We keep our technician app files in `apps/technician`.
- We share our Firebase connection through `packages/backend`.
- We use the same Firebase project for both apps.
- We keep our `.env` files and private account information out of GitHub.
- We create a branch for each Jira task and make our changes there.
- We open a pull request so our team can review the changes before they go into the main branch.

In CSC 191, we will add more details about the database, user roles, app setup, and how future developers can maintain the project.
