[View the Demo](https://alexanderspirgel.com/music-app)

To request credentials please reach out to me. The app needs to be private for copyright reasons.

## Tech Stack

### Front-End
- TypeScript
- React
- Howler JS
- SASS
- Vite

### Back-End
- Python
- FastAPI
- AWS S3
- AWS Lambda

## Known Issues:
Howler JS has many issues. I am working on my own solution to replace it. Some of the issues I am working to fix are:
- Howler JS web audio doesn't interact well with browser media session api, despite being more performant than html5 at playing audio. Fo now only html5 is used to enable browser media controls.
- Howler JS doesn't support download percentages. I think showing download status to the user could be helpful.
- Howler JS doesn't support dynamic switching between file sources which is useful in the case of presigned URLs.
- Howler JS doesn't support dynamic switching between web audio and html5 which both have different strengths and weaknesses that I would like the dynamically take advantage of.
- Howler JS doesn't detect loading/playing errors fast enough when a presigned url expires.
- Howler JS controls stop working after spammed commands.

Library and queue functionality are largely unfinished. I wanted to focus on the player itself for this project. The library and queue were built to be very basic, mostly to enable the player functionality.


## Development Notes

Navigate to `./controller` and run `npm install`.

Navigate to `./view/react` and run `npm install`, then run `npm run dev` to spin up a local development server.

### Deploying

Navigate to `./view/react` and run `npm run build`, then `npm run deploy`.