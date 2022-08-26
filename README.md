# Instructions for using this package during the hackathon

## Disclaimer

In its current form, this project is very much in the development phase and is only currently built to be used locally to help build an initial proof of concept. As we tidy up the rough edges of this project, the intention is to make this package a little more polished and closer to a releasable state.

## Linking the package locally

- Clone this repository locally
- Add the plugin to the `netlify.toml`, specificying the local path:
  ```
  [[plugins]]
      package = "../folder-name-you-gave-the-plugin-project"
  ```
- Run `netlify build` on your netlify site and the build plugin should be triggered

## Making changes to the package and testing locally

Currently the best way to test your changes locally is as follows:

- Make a change to some of the code in this project
- Run `yarn build` once you have finished making the changes
- Go to the project using the plugin and run `netlify build` and the project will use the updated version of the plugin
