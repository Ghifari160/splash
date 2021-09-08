# Splash in Kubernetes

Splash is designed to work in the cloud.
Every release are validated to be used inside Docker, and every release since v0.5.1 are validated to work inside Kubernetes.

## Quick deployment

You can quickly deploy Splash in Kubernetes by running the following command

``` shell
kubectl apply -f https://raw.githubusercontent.com/ghifari160/splash/v0.5.1/k8s/quick-deployment.yaml
```

This will create a Deployment and a Service, both under the name `splash`.

To create a configurable Splash deployment, use [deployment.yaml](deployment.yaml) and see [below](#configuring-splash-deployment).

## Configuring Splash deployment

Splash is configurable at the application level and and the container level.

### Application instance configuration

Splash instances are configurable through `config.json`.
This will be generated on first launch.
Splash will attempt to upgrade legacy `config.json` on first launch.

| Configuration Key     | Type     | Default          | Description                                  |
|-----------------------|----------|------------------|----------------------------------------------|
| `.version`            | `string` | current version  | Instance config version                      |
| `.instance`           | `object` |                  | Instance configuration object                |
| `.instance.id`        | `string` | generated UUIDv4 | Instance ID (displayed on page footer)       |
| `.server`             | `object` |                  | Server configuration object                  |
| `.server.listen_port` | `string` | `8080`           | Server listen port                           |
| `.server.public_port` | `string` | `8080`           | Server public port (i.e. reverse proxy port) |

### Application project configuration

Splash operates on projects.
Individual Splash pages are segmented into their own projects.

Each project lives inside `data` directory.
The name of each project configuration must be formatted as `*.json`.

| Configuration Key | Type     | Required | Default               | Description               |
|-------------------|----------|----------|-----------------------|---------------------------|
| `.id`             | `string` | no       | request hostname      | Project ID                |
| `.cn`             | `string` | no       | assumed from `.id`    | Project common name       |
| `.domain`         | `string` | yes      | N/A                   | Project domain filter     |
| `.title`          | `string` | no       | `Under Construction`  | Page heading title        |
| `.subtitle`       | `string` | no       | project ID            | Page heading subtitle     |
| `.page_title`     | `string` | no       | assumed from `.title` | Document title (`<title>` tag). Only observed on the builtin page |
| `.page`           | `string` | no       | N/A                   | Path to page to be served |
| `.redirect`       | `string` | no       | N/A                   | If set, access to the project will simply redirect to the target. Internal (between projects) redirects can be configured with `@projectid` as the value |

### Container configuration

Volume mounts

| Container Path                | Required | Description                        |
|-------------------------------|----------|------------------------------------|
| `/var/www/splash/data`        | no       | Project configuration directory    |
| `/var/www/splash/config.json` | no       | Splash instance configuration file |

### Kubernetes Deployment configuration

Since `config.json` is generated, it's best to leave this as is.

Projects should be configured through Kubernetes ConfigMap and mounted into the Splash container.

**Note:** Splash currently cannot read a directory mounted ConfigMap.
As a workaround, each project configuration file should be specified.
The following is a known working stub of `deployment.yaml`

``` yaml
...
        volumeMounts:
        - name: splash-projects-splash
          mountPath: /var/www/splash/data/splash.json
          subPath: splash.json
        - name: splash-projects-resplash
          mountPath: /var/www/splash/data/resplash.json
          subPath: resplash.json
      volumes:
        - name: splash-projects-splash
          configMap:
            name: splash-projects
            items:
            - key: splash.json
              path: splash.json
        - name: splash-projects-resplash
          configMap:
            name: splash-projects
            items:
            - key: resplash.json
              path: resplash.json
```

## Ingress configuration

You will need to configure your own Ingress. The following is an example for `ingress-nginx`

``` yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: splash
  annotations:
    kubernetes.io/ingress.class: "nginx"
spec:
  rules:
  - host: splash.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: splash
            port:
              number: 80
```
