# Netlify Emails Plugin

The Netlify emails build plugin which is responsible for creating a serverless function to handle email requests, populating them with the provided templates and sending them using the specified email API provider.

## Enabling the plugin

Either add it to the `netlify.toml` as follows:

```
[[plugins]]
  package = "@netlify/emails-plugin"
```

Or via the Netlify app.

## Configuration

The following environment variables are required in order for the emails function to handle requests:

| Variable Name                       | Description                                                                            | Required |
| ----------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| `NETLIFY_EMAILS_PROVIDER`           | "mailgun" \| "sendgrid" \| "postmark"                                                  | Yes      |
| `NETLIFY_EMAILS_SECRET`             | The unique secret used to authenticate a request is genuine                            | Yes      |
| `NETLIFY_EMAILS_PROVIDER_API_KEY`   | The API key issued by the email provider                                               | Yes      |
| `NETLIFY_EMAILS_MAILGUN_DOMAIN`     | If the provider is set to Mailgun, the domain must be set                              | No       |
| `NETLIFY_EMAILS_DIRECTORY_OVERRIDE` | If set, this will override the default directory `./emails` when looking for templates | No       |
