# TravelBloom — Travel Recommendation Website

A responsive travel discovery website built with HTML, CSS and vanilla JavaScript.

**Live website:** https://Alikhan808.github.io/travelbloom-recommendations/

**Public repository:** https://github.com/Alikhan808/travelbloom-recommendations

## Pages
- Home: `index.html` — introduction, search, category filters, recommendation cards and destination details.
- About Us: `about.html` — introduction, story, values and clearly labeled illustrative team profiles.
- Contact Us: `contact.html` — name, email and message fields with browser validation and JavaScript confirmation.
- Photo credits: `credits.html` — original image sources, author credits and license links.

## Features
- Consistent navigation bar on every page.
- Search and Clear controls; Enter also submits a search.
- Case-insensitive and whitespace-tolerant keyword matching.
- Beach/beaches: Whitehaven Beach and Bora Bora, with two photographs.
- Temple/temples: Angkor Wat and Kiyomizu-dera, with two photographs.
- Country recommendations: Australia, Japan and Brazil, with two city images per country.
- Search by city, such as Tokyo, Sydney or Kyoto; common country aliases are supported.
- A details dialog with additional descriptions, destination-local time, maps and background links.
- Saved places persisted locally in the visitor's browser.
- Responsive layouts, keyboard focus styles, image alt text and reduced-motion support.
- Recommendation data loaded with `fetch()` from `travel_recommendation_api.json`.

## Rubric mapping
| Requirement | Implementation |
|---|---|
| Public GitHub repository | This repository |
| Home, About Us and Contact Us | Three separate HTML pages |
| Navigation | Brand, three page links, keyword input, Search and Clear |
| Home introduction | Hero title, introductory paragraph and discovery link |
| About Us elements | Company introduction, values and team names, descriptions and roles |
| Contact email form | Validated name, email, message and submit button |
| Two beach images | Search `beach` or `beaches` |
| Two temple images | Search `temple` or `temples` |
| Two images per country | Search `Australia`, `Japan` or `Brazil` |

## Run locally
Serve the folder over HTTP (opening HTML directly via `file://` may block JSON fetching):

```sh
python -m http.server 8000
```

Open http://localhost:8000/. No installation or build step is needed.

## GitHub Pages
The website can be published from the `main` branch, root directory. All asset paths are relative so the project works under a repository subpath.

## Demonstration scope
The contact form is a front-end demonstration. It validates the input and displays a confirmation; it does not send email, call a backend or store the message. Team profiles are illustrative. There are no reservations, payments or user accounts.

## Images
All destination images are stored locally in `images/`. See `credits.html` for original Wikimedia Commons file pages, authors and licenses. Images have been resized and converted to WebP. The original image licenses continue to apply.
