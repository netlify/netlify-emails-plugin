# Netlify Emails Plugin

🚧 Note: This plugin is pre-release software. Until version 1.0.0 is released, its API could change at any time.

The Netlify emails build plugin which is responsible for creating a serverless function to handle email requests, populating them with the provided templates and sending them using the specified email API provider.

## Step 1: Enabling the plugin

Either add it to the `netlify.toml` as follows:

```
[[plugins]]
  package = "@netlify/emails-plugin"
```

Or via the Netlify app.

## Step 2: Configuration

The following environment variables are required in order for the emails function to handle requests:

| Variable Name                       | Description                                                                            | Required |
| ----------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| `NETLIFY_EMAILS_PROVIDER`           | "mailgun" \| "sendgrid" \| "postmark"                                                  | Yes      |
| `NETLIFY_EMAILS_SECRET`             | The unique secret used to authenticate a request is genuine                            | Yes      |
| `NETLIFY_EMAILS_PROVIDER_API_KEY`   | The API key issued by the email provider                                               | Yes      |
| `NETLIFY_EMAILS_MAILGUN_DOMAIN`     | If the provider is set to Mailgun, the domain must be set                              | No       |
| `NETLIFY_EMAILS_DIRECTORY_OVERRIDE` | If set, this will override the default directory `./emails` when looking for templates | No       |

## Step 3: Adding Templates

Now that the setup is complete, you can add templates to your email directory. Each email template should be stored under a folder name that represents the route of your template and the email file should be named `index.html`. E.g. `./emails/welcome/index.html`.

If there are variables that need replacing in your email template when the email is triggered, please use the [handlebars.js](https://handlebarsjs.com/) syntax and pass the arguments in the request as shown in Step 4 below.

## Step 4: Triggering an Email

Once deployed, you can now trigger the email handler by calling the following endpoint:

```
curl -X POST \
  'https://yourdomain.com/.netlify/functions/emails/welcome' \
  --header 'netlify-emails-secret: NETLIFY_EMAILS_SECRET' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "from": "no-reply@yourdomain.com",
  "to": "alexanderhamilton@test.com",
  "subject": "Welcome",
  "parameters": {
    "products": ["product1", "product2", "product3"]
    "name": "Alexander",
  }
}'
```

You can also trigger the email locally by running `netlify build`, then `netlify dev` and calling:

```
curl -X POST \
  'http://localhost:{PORT}/.netlify/functions/emails/welcome' \
  --header 'netlify-emails-secret: NETLIFY_EMAILS_SECRET' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "from": "no-reply@yourdomain.com",
  "to": "alexanderhamilton@test.com",
  "subject": "Welcome",
  "parameters": {
    "products": ["product1", "product2", "product3"]
    "name": "Alexander",
  }
}'
```

## Step 5: Previewing emails locally

Visit `http://localhost:{PORT}/.netlify/functions/emails/_preview` to preview your email templates.

Please note, this preview endpoint is not made available in production and is only made available locally or when viewing a deploy preview.
