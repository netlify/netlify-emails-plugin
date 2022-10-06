# Instructions for using this package during the hackathon

## Disclaimer

In its current form, this project is very much in the development phase and is only currently built to be used locally to help build an initial proof of concept. As we tidy up the rough edges of this project, the intention is to make this package a little more polished and closer to a releasable state.

## Linking & installing the package locally

- Clone this repository locally
- Run `yarn build`
- Navigate to your own netlify application (suggest a hobby project)
- Add the plugin to the `netlify.toml` of your hobby project, specificying the local path:
  ```
  [[plugins]]
      package = "../folder-name-you-gave-the-plugin-project"
  ```
- Add this to the `package.json` of your hobby project:
  ```
    "dependencies": {
       "@netlify/plugin-emails": "file:../folder-name-you-gave-the-plugin-project",
  ```
- Run `yarn` on your hobby project
- Run `netlify build` on your hobby project and the build plugin should be triggered

## How to use the plugin?

- Add the following file with some basic html to your hobby project `./emails/welcome/index.html`
- Run `netlify build`
- Run `netlify dev`
- Visit your site locally and append `/.netlify/functions/email/welcome` to the address
- This will trigger the email function and you should see logs printing the html content

## Making changes to the package and testing locally

Currently the best way to test your changes locally is as follows:

- Make a change to some of the code in this project
- Run `yarn build` once you have finished making the changes
- Go to the project using the plugin and run `netlify build` and the project will use the updated version of the plugin
