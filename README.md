# k8s-yaml-tools

Collection of tools for dealing with kubernetes YAML files.

## Tools

- `print-yaml-paths.js` prints all available paths in a YAML file -
  helpful when creating patches with [kustomize](https://kustomize.io/)
  - Use with `deno run --allow-read --allow-net https://deno.land/x/k8s_yaml_tools@v1.0.2/print-yaml-paths.js`
- `split-k8s-yaml-files.js` separates the YAML files within a file and
  stores them as separate files in the `generated/` directory
  - Use with `deno run --allow-read --allow-write --allow-net https://deno.land/x/k8s_yaml_tools@v1.0.2/split-k8s-yaml-files.js`
