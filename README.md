[![Docker Pulls](https://img.shields.io/docker/pulls/m4ty/swarmhook?maxAge=4800)](https://hub.docker.com/r/m4ty/swarmhook)

![Swarmhook logo](assets/swarmhook.png "Swarmhook logo")

# Swarmhook

Table of Contents
=================

* [Introduction](#introduction)
* [Installation](#installation)
  * [Docker Swarm stack](#docker-swarm-stack)
  * [Calling the webhook](#calling-the-webhook)
* [Configuration](#configuration)
  * [Using latest version](#using-latest-version)
  * [Using specific version](#using-specific-version)
  * [Notifications](#notifications)
    * [Discord](#discord)
* [Future plans](#future-plans)

### Introduction

#### What is Swarmhook?

Swarmhook is a simple service that allows redeploying Docker Swarm services through webhooks.

### Installation

Swarmhook was built with Docker in mind and offers effortless integration.

#### Docker Swarm stack

Create a file called `swarmhook.yml` and paste the following content into it:

```yml
version: "3"
services:
  swarmhook:
    image: m4ty/swarmhook:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./config.yml:/app/config.yml
    env_file: .env
    deploy:
      placement:
        constraints:
          - node.role == manager
```

After creating this file, create a file called `config.yml`, where all the webhook configurations are saved:

```yml
webhooks:
  services:
    service_a:
      token: "abc"
      service_name: "service_a"
      latest: true
```

This is the most basic configuration that pulls the latest image when the webhook is triggered. Check the Configuration
section for advanced
configurations.

You will also have to create a `.env` file that will contain Docker Hub credentials for pulling images:

```text
DOCKER_USERNAME=<username>
DOCKER_PASSWORD=<token>
```

After creating all these files you can run `docker stack deploy -c swarmhook.yml swarmhook` and call the webhooks!

#### Calling the webhook

The webhooks are called using a POST request. The endpoint is `<url>/webhooks/:serviceName`. The body can be empty if
using `latest: true` is set in the `config.yml`, otherwise the body has to have a `versionTag` property with the tag to
deploy.

Example (deploys `service_a` to tag `v1.6.2`):

```http request
POST http://localhost:3000/webhooks/service_a
Authorization: Bearer secret_webhook_token
Content-Type: application/json

{
  "versionTag": "v1.6.2"
}
```

### Configuration

The config.yml file has different types of configurations.

#### Using latest version

When a service uses latest as a default tag for deploying, you have the possibility to set it with the `latest: true`
property. In case this property is set to true, you do not need to specify the image the services uses, as shown in
service_a:

```yml
webhooks:
  services:
    service_a:
      token: "abc"
      service_name: "service_a"
      latest: true
```

#### Using specific version

In case you are using [semver](https://semver.org/), or any other versioning, specifying the version that should be
deployed is necessary. When setting `lastest: false`and specifying the `image` property, you will be able to send the
version via request body.

In the example below, service_b will not deploy `:latest`by default, but will look for a tag sent in body and try to
deploy an image with the tag.

```yml
webhooks:
  services:
    service_a:
      token: "abc"
      service_name: "service_a"
      latest: true
    service_b:
      token: "abc"
      service_name: "service_b"
      latest: false
      image: "org/example"
```

#### Notifications

> Disclaimer: The implementation of Notifications are still in an early stage and the config structures may change.

Service webhooks can also trigger other webhooks, that can for example send notifications to a different range of
services.

Currently, the only supported notification channel is Discord, but other integrations like Slack, Teams, HTTP Request
and many more are planned.

##### Discord

Example of setting up a Discord webhook:

```yaml
webhooks:
  services:
    service_a:
      token: "abc"
      service_name: "service_a"
      latest: true
    service_b:
      token: "abc"
      service_name: "service_b"
      latest: false
      image: "org/example"
notifications:
  discord:
    - url: <url>
      services:
        - ALL
    - url: <url>
      services:
        - service_a
```

As visible in the example above, you have the ability to choose which services should be sent to which Discord webhooks.
In case you want all of them, you can use the value `ALL`.

### Future plans

- [ ] Add more webhook types
- [ ] Create an administration UI with logs, webhook management and more
- [ ] Support for JSON config file
- [ ] Refactor
