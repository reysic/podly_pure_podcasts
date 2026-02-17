# [2.1.0](https://github.com/reysic/podly_pure_podcasts/compare/v2.0.2...v2.1.0) (2026-02-17)


### Features

* add latest-lite tag that updates only on releases ([4272cd9](https://github.com/reysic/podly_pure_podcasts/commit/4272cd9aef1112f07bae6f1aa47388143819c24a))

## [2.0.2](https://github.com/reysic/podly_pure_podcasts/compare/v2.0.1...v2.0.2) (2026-02-17)


### Bug Fixes

* correct Docker workflow matrix syntax ([17a4a8d](https://github.com/reysic/podly_pure_podcasts/commit/17a4a8dd695e6512d069bf89e753da46289b4958))

## [2.0.1](https://github.com/reysic/podly_pure_podcasts/compare/v2.0.0...v2.0.1) (2026-02-17)


### Bug Fixes

* improve dark mode visibility for episode processing status ([4f5af05](https://github.com/reysic/podly_pure_podcasts/commit/4f5af054ba6c05c132e73eff93ff2da4eed22bc7))

# [2.0.0](https://github.com/reysic/podly_pure_podcasts/compare/v1.2.0...v2.0.0) (2026-02-17)


### Features

* optimize Docker builds and fix version display ([dc988d0](https://github.com/reysic/podly_pure_podcasts/commit/dc988d058affb5b87aa9e95bdb6eb8ae20127e8f))


### BREAKING CHANGES

* Docker workflow now builds only lite-amd64 by default for faster deployments. Use workflow_dispatch with 'all-variants' to build all platforms.

- Only build lite-amd64 variant by default (significantly faster)
- Add workflow_dispatch input to optionally build all variants
- Skip arm64 builds unless explicitly requested
- Add VERSION build arg to Docker image
- Fix version endpoint to read PODLY_VERSION env var from Docker image
- Improve content filtering error messages for Copilot SDK
- Detect Azure OpenAI content filtering errors and provide clearer messages

# [1.2.0](https://github.com/reysic/podly_pure_podcasts/compare/v1.1.1...v1.2.0) (2026-02-17)


### Features

* add dark mode support to user management screen ([647c779](https://github.com/reysic/podly_pure_podcasts/commit/647c779d4f9642491dcf0a8cb3c62318b12cc5c2))

## [1.1.1](https://github.com/reysic/podly_pure_podcasts/compare/v1.1.0...v1.1.1) (2026-02-17)


### Bug Fixes

* properly close Copilot client connections to prevent resource exhaustion ([2e073b8](https://github.com/reysic/podly_pure_podcasts/commit/2e073b8eddb702a462bad727893a9df28317a730))

# [1.1.0](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.5...v1.1.0) (2026-02-16)


### Bug Fixes

* complete dark mode support for remaining UI elements ([f3ab87c](https://github.com/reysic/podly_pure_podcasts/commit/f3ab87c573f2c6d69e61ba75f240663c7827e268))
* comprehensive dark mode improvements for visibility and consistency ([64adfbe](https://github.com/reysic/podly_pure_podcasts/commit/64adfbea0c1dd2927d975ecb2836016561da12e9))
* correct TypeScript errors in ConfigTabs ([b557cca](https://github.com/reysic/podly_pure_podcasts/commit/b557cca7100436768ea848730ff3e7efc95916d1))
* improve dark mode support for main UI components ([8cda522](https://github.com/reysic/podly_pure_podcasts/commit/8cda5220496e79b7a6b287989e3b6e5770d80f18))
* improve dark mode visibility for podcast list and buttons ([3713030](https://github.com/reysic/podly_pure_podcasts/commit/37130309e0206b03d9308a2d53c8f3cb6fb87bbb))
* use CSS property instead of Tailwind class for textarea resize ([e20b01b](https://github.com/reysic/podly_pure_podcasts/commit/e20b01be3f73396392279aef200b141930342a3a))
* use type-only import for ReactNode ([75ee92c](https://github.com/reysic/podly_pure_podcasts/commit/75ee92ca2a2677b78b9a90b2a279642a848a6660))


### Features

* add dark mode support and version display ([754712e](https://github.com/reysic/podly_pure_podcasts/commit/754712ec9ff024f062f294bee84edf3d13650ab8))
* add dark mode support to diagnostics modal ([014b762](https://github.com/reysic/podly_pure_podcasts/commit/014b7620bbb68034004110b88b648fb005860ce0))

## [1.0.5](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.4...v1.0.5) (2026-02-16)


### Bug Fixes

* disable too-many-branches pylint warning for _call_model ([008f1b4](https://github.com/reysic/podly_pure_podcasts/commit/008f1b42c0bae09c95d06e55679745da8ad1f038))

## [1.0.4](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.3...v1.0.4) (2026-02-16)


### Bug Fixes

* resolve pylint warnings for Copilot integration ([1dad7c6](https://github.com/reysic/podly_pure_podcasts/commit/1dad7c6200dafaf34a7690162c1530aed9dcfd45))

## [1.0.3](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.2...v1.0.3) (2026-02-16)


### Bug Fixes

* cast Copilot response content to str in boundary_refiner ([ff694f9](https://github.com/reysic/podly_pure_podcasts/commit/ff694f9db82a5e934f1b80a04fdc174c3e17a78c))

## [1.0.2](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.1...v1.0.2) (2026-02-16)


### Bug Fixes

* resolve remaining mypy type errors ([51ebbe2](https://github.com/reysic/podly_pure_podcasts/commit/51ebbe2fcfd430d915fb4baf1062a8d378750641))

## [1.0.1](https://github.com/reysic/podly_pure_podcasts/compare/v1.0.0...v1.0.1) (2026-02-16)


### Bug Fixes

* add type annotations for Copilot SDK functions ([4b54de0](https://github.com/reysic/podly_pure_podcasts/commit/4b54de09c4a037e14f7968a10067a37703461875))

# 1.0.0 (2026-02-16)


### Bug Fixes

* feed urls were not being properly generated with reverse proxy settings ([be7dbfd](https://github.com/reysic/podly_pure_podcasts/commit/be7dbfdf65157cc601028e1eb373a541266504dd))
* reformat completed by ci.sh ([9dae208](https://github.com/reysic/podly_pure_podcasts/commit/9dae20816d7485048ac13f74b6671019eb9b88ba))
* update container name and network name to podly-pure-podcasts across all compose files ([4a4603e](https://github.com/reysic/podly_pure_podcasts/commit/4a4603efa07ba95b6d0123cfa72ff68447df8310))


### Features

* add GitHub Copilot model support for ad identification ([e77eb79](https://github.com/reysic/podly_pure_podcasts/commit/e77eb79524f0497538237503e7753e9ec836124f))
* add support for local LLMs ([c2ded6b](https://github.com/reysic/podly_pure_podcasts/commit/c2ded6b9eff1d7f4d8665be543255d74b8baf13f))
* add support for local LLMs ([0320f24](https://github.com/reysic/podly_pure_podcasts/commit/0320f24c9b121c04f264b57d8456c7cecaf43776))
* **processing:** add JobManager; refactor processor/API/UI; remove legacy jobs ([01a139f](https://github.com/reysic/podly_pure_podcasts/commit/01a139f340ea7cf6221341598d459ee1c6c396c0))


### Reverts

* test_process_audio.py ([bbbd0f1](https://github.com/reysic/podly_pure_podcasts/commit/bbbd0f18e85710820947ba3f4fd35d9a40b390ae))
