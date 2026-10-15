# Cougar-Electric-Mobile-App
CSC 190/191 senior project — a React Native mobile application developed for Cougar Electric Inc. to streamline company operations.

## Customer registration

Run `npm install` and `npm start`, then open with a compatible Expo Go client or development build. Use `npm run web` for the browser version. The initial Expo Router screen is sign-in at `src/app/index.tsx`. “Create here” opens `src/app/register.tsx`; registration includes links back to sign-in.

The registration form collects a name, email, phone, US service address, password, and password confirmation. It validates required fields, contact formats, ZIP code, password length (12 characters), and matching passwords.

The interface uses the reference's near-black and navy palette, yellow accents, white headings, and outlined panels. The lightning badge is a placeholder for the final Cougar logo.

This is a frontend-only preview. Submitting valid registration details shows a local confirmation and a link to sign-in. Sign-in validates email and a nonempty password, then displays a local welcome screen. Neither flow authenticates with a server or makes API calls. No account is created and no information is saved. The unused API helper in `src/helpers/AccountHelp.ts` is available for future backend integration; setting an endpoint does not enable it in the current screen.

Run `npm run lint` and `npm run typecheck` to check changes.

## Where to find things

| File | Purpose |
| --- | --- |
| `src/pages/SignIn.tsx` | The sign-in page |
| `src/pages/CreateAccount.tsx` | The create-account page |
| `src/parts/Logo.tsx` | The company logo and name |
| `src/parts/TextBox.tsx` | A box where you type, with a label and error message |
| `src/styles/PageStyle.ts` | Colors, sizes, and spacing for both pages |
| `src/helpers/AccountHelp.ts` | Checks account details; includes a helper for a future server connection |
| `src/app/index.tsx` | Connects the opening route `/` to the sign-in screen |
| `src/app/register.tsx` | Connects `/register` to the registration screen |
| `src/app/_layout.tsx` | Sets up the pages and phone status bar |

Expo Router gives `index.tsx` and `_layout.tsx` special meaning, so those filenames stay as required. Route files are small entry points; edit the descriptive files in `src/pages/` to change the pages. Existing URLs and navigation stay the same.

Folder names: `pages` holds whole pages, `parts` holds reusable pieces, `styles` controls how things look, and `helpers` holds supporting code. Files in `app` connect page addresses to the pages. Root configuration files such as `package.json`, `app.json`, and `tsconfig.json` keep their standard names because the tools expect them.
