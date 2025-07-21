# AGENTS Instructions for Morfema Librería Repository

These guidelines apply to the entire repository. They are intended to keep the static web site clean and consistent without being overly restrictive.

## General Guidelines

- Keep all HTML, CSS and JavaScript readable and consistently formatted.
- Use Spanish for textual content unless specifically noted otherwise.
- Avoid introducing heavy tooling or frameworks. This project is a static site meant for Firebase Hosting.
- Keep commit messages short (ideally under 50 characters) and in the imperative mood.

## Formatting

- Use two spaces for indentation in HTML, CSS and JS files.
- Prefer double quotes for HTML attributes and JS strings.
- Trim trailing whitespace.
- Before committing changes, run Prettier on any HTML, CSS or JS files you modified. Example:

```sh
npx prettier --write public/path/to/file.html
```

## Programmatic Checks

After edits and before each commit, verify formatting of the files you touched with:

```sh
npx prettier --check public/path/to/file.html
```

If this command reports issues, run the formatting command above and recheck.

There are currently no additional tests or build steps.

## Pull Request Notes

Include a short summary of the major changes in the PR body. Mention any new files or pages added. Do not include changelog style bullet lists.
