<h1 align="center">
    <img width="120" height="120" src="public/pic/logo.png" alt=""><br>
    auto-pixai
</h1>

<p align="center">
    <a href="https://github.com/Mr-Smilin/auto-pixai/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Mr-Smilin/auto-pixai?style=flat-square"></a>
    <a href="https://github.com/Mr-Smilin/auto-pixai"><img src="https://img.shields.io/github/stars/Mr-Smilin/auto-pixai?style=flat-square"></a>
    <a href="https://hub.docker.com/r/smile0301/auto-pixai"><img src="https://img.shields.io/github/v/release/Mr-Smilin/auto-pixai?style=flat-square&label=version&color=orange"></a>
</p>

Automatically claim daily rewards on pixai.art  
[中文自述在這裡](./readme.md)

## Getting Started

```bash
docker pull smile0301/auto-pixai
docker run -e LOGINNAME=<your-username> -e PASSWORD=<your-password> --name <container-name> smile0301/auto-pixai
```

Replace `<container-name>` with a name of your choice to consistently identify the container.

### Manual Operations

```bash
# Start the container manually
docker start <container-name>
# Stop the container manually
docker stop <container-name>
# Check container status
docker inspect <container-name>
```

## About Username and Password

If you are using third-party login and do not have a username and password:

Please visit [Your Profile Page](https://pixai.art/profile/edit)

![account](https://i.imgur.com/tjfOabI.png)

You can set up your username and password here. Modifying your username requires a verification email.

## Running Locally

If you prefer not to use `Docker`, you can run it locally:

Required environment `node:18.17.0`

Execute:

```bash
git clone https://github.com/Mr-Smilin/auto-pixai.git
npm install
```

Edit `app.js`:

```bash
const username = process.env.LOGINNAME ? process.env.LOGINNAME : undefined;
const password = process.env.PASSWORD ? process.env.PASSWORD : undefined;
const isDocker = true;
```

Execute:

```bash
npm start
```
