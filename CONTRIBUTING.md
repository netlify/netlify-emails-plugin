# Contributions

🎉 Thanks for considering contributing to this project! 🎉

These guidelines will help you send a pull request.

If you're submitting an issue instead, please skip this document.

If your pull request is related to a typo or the documentation being unclear, please click on the relevant page's Edit button (pencil icon) and directly suggest a correction instead.

This project was made with ❤️. The simplest way to give back is by starring and sharing it online.

## Development process

First, fork and clone the repository. If you’re not sure how to do this, please watch
[these videos](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github).

If you want to point to your local version of the plugin, it is recommeneded that you do the following:

1. Disable the email plugin, via the UI, for the site that is linked to your project
2. Enable the plugin, via the `netlify.toml` file, adding the following:
   ```
   [[plugins]]
       package = "../path/to/local/package"
   ```
3. Remove all node_modules and delete all contents within your `.netlify` folder, except for `state.json`
4. Add all of your dependencies again with `yarn install` and run `netlify build && netlify dev`

Tests are run with:

```bash
yarn test
```

## Releasing

We use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and [release-please](https://github.com/googleapis/release-please), which helps to automatically craft a release PR following the merge of your PR.
