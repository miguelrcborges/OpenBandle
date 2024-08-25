const title_search = document.querySelector("#title-search");
const tracks_completion = document.querySelector("#tracks-completion");
const level_indicator = document.querySelector("#level-indicator");
const level_1_el = document.querySelector("#level-1");
const level_2_el = document.querySelector("#level-2");
const level_3_el = document.querySelector("#level-3");
const level_4_el = document.querySelector("#level-4");
const level_5_el = document.querySelector("#level-5");
const audio = document.querySelector("audio");
const filters_container = document.querySelector("#filters-container");

let searchTimeout = undefined;

title_search.addEventListener('keydown', async () => {
	if (searchTimeout) {
		clearTimeout(searchTimeout);
	}
	searchTimeout = setTimeout(async () => {
		const url = "https://corsproxy.io/?https://api.deezer.com/search/track?limit=10&q=" + encodeURIComponent(title_search.value);
		const r = await fetch(url);
		if (r.status != 200) {
			tracks_completion.innerHTML = "";
			return;
		}
		const json = await r.json();
		if (json.data === undefined) {
			tracks_completion.innerHTML = "";
			return;
		}
		
		const strings = new Set();
		for (let i = 0; i < json.data.length; i += 1) {
			strings.add(`${json.data[i].artist.name} - ${json.data[i].title}`);
		}
		
		const elements = []
		strings.forEach(s => {
			const e = document.createElement('option');
			e.value = s;
			elements.push(e);
		});
		tracks_completion.replaceChildren(...elements);
	}, 200);
})


const tags = {};

fetch("https://raw.githubusercontent.com/miguelrcborges/OpenBandle/tracks/filters.json").then(r => r.json()).then(filters => {
	const tags_strings = Object.keys(filters);
	for (let i = 0; i < tags_strings.length; i += 1) {
		const tag_filter_container = document.createElement('div');
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.setAttribute('type', 'checkbox');
		checkbox.setAttribute('name', tags_strings[i]);
		checkbox.setAttribute('id', tags_strings[i]);
		checkbox.checked = true;
		tag_filter_container.appendChild(checkbox);
		const label = document.createElement('label');
		label.textContent = tags_strings[i][0].toUpperCase() + tags_strings[i].slice(1);
		label.setAttribute("for", tags_strings[i]);
		tag_filter_container.appendChild(label);
		filters_container.appendChild(tag_filter_container);
		tags[tags_strings[i]] = {
			"count": filters[tags_strings[i]],
			"checkbox": checkbox
		};
	}
	loadTrack();
	document.querySelector('#next-track').addEventListener('click', loadTrack);
	document.querySelector('#skip').addEventListener('click', loadNextLevel);
	document.querySelector('#submit').addEventListener('click', submit);
});

let current_track;
let current_level;

async function loadTrack() {
	const keys = Object.keys(tags);
	let track_count = 0;
	for (let i = 0; i < keys.length; i += 1) {
		if (tags[keys[i]].checkbox.checked) {
			track_count += tags[keys[i]].count;
		}
	}
	const id = Math.floor(Math.random() * track_count) + 1;
	let url;
	for (let i = 0; i < keys.length; i += 1) {
		if (tags[keys[i]].checkbox.checked == false) {
			continue;
		}
		if (tags[keys[i]].count >= track_count) {
			url = `https://raw.githubusercontent.com/miguelrcborges/OpenBandle/tracks/${keys[i]}/${track_count}.json`
			break;
		}
		track_count -= tags[keys[i]].count;
	}
	const r = await fetch(url);
	if (r.status != 200) {
		location.reload()
	}
	current_track = await r.json();
	current_level = 1;
	level_1_el.textContent = `Level 1 - ${current_track.instruments[0]}`;
	level_2_el.textContent = `Level 2 - ${current_track.instruments[1]}`;
	level_3_el.textContent = `Level 3 - ${current_track.instruments[2]}`;
	level_4_el.textContent = `Level 4 - ${current_track.instruments[3]}`;
	level_5_el.textContent = `Level 5 - ${current_track.instruments[4]}`;
	level_indicator.textContent = `Level 1`;

	audio.src = current_track.audios[0];
	audio.load();
}

function loadNextLevel() {
	if (current_level == 5) {
		alert("You are already at the last level. More hints can't be given.");
		return;
	}
	
	audio.pause();
	audio.src = current_track.audios[current_level];
	audio.load();
	current_level += 1;
	level_indicator.textContent = `Level ${current_level}`;
}

function submit() {
	if (title_search.value == current_track.track) {
		alert("Congratulations, you got it correctly.");
		loadTrack();
	} else {
		alert("Wrong answer.");
		loadNextLevel();
	}
	title_search.value = "";
	tracks_completion.innerHTML = "";
}
