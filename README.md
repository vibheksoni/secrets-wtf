<p align="center">
  <img src="assets/secrets-wtf-social.png" alt="secrets.wtf public exposure listings" width="1200">
</p>

# secrets.wtf

Defensive exposure awareness for AI infrastructure.

`secrets.wtf` documents publicly reachable AI model API surfaces such as Ollama and LM Studio so operators, researchers, and defenders can understand exposure, verify remediation, and reduce accidental public access across local LLM infrastructure.

Live site: [secrets.wtf](https://secrets.wtf/)

Research context: [OpenDoors](https://opendoors.wtf/)

Maintained by [Vibhek Soni](https://vibheksoni.com/) (`vibheksoni` / `@ImVibhek`), a New York backend systems builder and security researcher focused on AI infrastructure, browser automation, protocol analysis, MCP tooling, Python, Rust, and Go.

## Purpose

This project is defensive and remediation-focused.

The goal is to:

- help operators find and fix accidental public AI API exposure
- keep a public record of common exposed surfaces
- support security research and OpenDoors writeups with clear, factual host inventories
- remove or update hosts when operators secure them

This project is not intended for abuse, exploitation, credential harvesting, or unauthorized access. Do not use listed hosts to run workloads, access private data, bypass controls, or interfere with systems you do not own.

## Current Listings

| Listing | Surface | Hosts | Check |
| --- | --- | ---: | --- |
| [Ollama exposed API](https://secrets.wtf/listings/ollama/) | Port `11434` | 94 | `/v1/models` |
| [LM Studio local server](https://secrets.wtf/listings/lm-studio/) | Port `1234` | 87 | `/v1/models` |

## Host Data

The public host inventories are stored as JSON:

- [`data/hosts/ollama.json`](data/hosts/ollama.json)
- [`data/hosts/lmstudio.json`](data/hosts/lmstudio.json)

Each listing page loads the relevant JSON file and lets visitors filter hosts, check the current page, check all hosts, add hosts locally, and export additions for review.

## Contributing

Pull requests are welcome.

Useful PRs include:

- adding verified Ollama or LM Studio exposure observations
- removing dead or remediated hosts after verification
- adding model observations where available
- adding new exposure categories
- improving listing UI, pagination, filtering, or checks
- linking related OpenDoors research posts
- improving metadata, accessibility, or GitHub Pages behavior

For new categories, keep the format simple:

1. Add a listing page under `listings/<category>/`.
2. Add a matching JSON inventory under `data/hosts/`.
3. Add the listing to the homepage.
4. Add the page to `sitemap.xml`.
5. Keep wording compact, factual, and remediation-focused.

## Host Takedown Requests

If you own or operate a listed host and want it removed, open a GitHub issue using the host takedown template:

https://github.com/vibheksoni/secrets-wtf/issues/new/choose

Include:

- the exact host or URL
- which listing it appears in
- a short ownership or operator note
- whether the service has been secured, firewalled, or shut down

Removal requests are welcome. The goal is to document exposure and help reduce it, not keep fixed hosts listed forever.

Please do not include private credentials, tokens, customer data, internal screenshots, or unrelated sensitive details in issues or pull requests.

## Local Development

This is a static GitHub Pages site. You can serve it locally from the repo root with any static file server.

Example:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

## Project Structure

```text
.
|-- index.html
|-- listings/
|   |-- ollama/
|   `-- lm-studio/
|-- data/
|   `-- hosts/
|-- js/
|-- styles/
|-- sitemap.xml
|-- robots.txt
`-- CNAME
```

## Related

- Portfolio: [vibheksoni.com](https://vibheksoni.com/)
- Blog: [opendoors.wtf](https://opendoors.wtf/)
- GitHub: [github.com/vibheksoni](https://github.com/vibheksoni)
- X: [@ImVibhek](https://x.com/ImVibhek)
