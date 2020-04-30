addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

// Element handler for elements that will be changed
class ElementHandler {
	constructor(textContent) {
		this.textContent = textContent;
	}
	element(element) {
		element.setInnerContent(this.textContent);
	}
}

// Attribute handler for the href that will be changed to link to my resume
class AttributehtmlRewriter {
	constructor(attributeName, textContent) {
		this.attributeName = attributeName;
		this.textContent = textContent;
	}

	element(element) {
		element.setInnerContent(this.textContent);
		element.setAttribute(
			this.attributeName,
			'https://drive.google.com/file/d/183rPRhEXf2S9nDW5GGZZIDZEdBzUSwJ3/view?usp=sharing'
		);
	}
}

// set up of the html htmlRewriter
const htmlRewriter = new HTMLRewriter()
	.on('title', new ElementHandler('This is my title now'))
	.on('h1#title', new ElementHandler('Cloudflare Intern Challenge'))
	.on('p#description', new ElementHandler('Edited by Sadeem Khan'))
	.on('a#url', new AttributehtmlRewriter('href', 'Check out my resume!'));

// Source: https://developers.cloudflare.com/workers/templates/pages/ab_testing/
async function handleRequest(request) {
	//set a returning string to add to the cookie
	const NAME = 'returning';

	//set api url to a const variable
	const url = 'https://cfw-takehome.developers.workers.dev/api/variants';

	//fetch the url and save to const variable
	const response = await fetch(url);

	//parse using.json
	const data = await response.json();

	//go in data objects -> variants and make array of the two variants
	const variants = data['variants'];

	//Set up the two different responses to send based on presence of cookie
	const RESPONSE1 = await fetch(variants[0], request);
	const RESPONSE2 = await fetch(variants[1], request);

	//get the cookies from request header
	let cookies = request.headers.get('cookie');

	if (cookies && cookies.includes(`${NAME}=variant1`)) {
		// if user returning and they got variant1, send back variant1 response
		return htmlRewriter.transform(RESPONSE1);
	} else if (cookies && cookies.includes(`${NAME}=variant2`)) {
		// else if user returning and they got variant2
		return htmlRewriter.transform(RESPONSE2);
	} else {
		//First time visiting, put in a group and set cookie
		let group = Math.random() < 0.5 ? 'variant1' : 'variant2'; // 50/50 split
		let response = group === 'variant1' ? RESPONSE1 : RESPONSE2;

		// new response so that we can mutate the header to include returning cookie for next visit
		response = new Response(response.body, response);
		response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`);
		return htmlRewriter.transform(response);
	}
}
