const title_search = document.querySelector("#title-search");
const tracks_completion = document.querySelector("#tracks-completion");
const level_indicator = document.querySelector("#level-indicator");
const level_1_el = document.querySelector("#level-1");
const level_2_el = document.querySelector("#level-2");
const level_3_el = document.querySelector("#level-3");
const level_4_el = document.querySelector("#level-4");
const level_5_el = document.querySelector("#level-5");
const audio = document.querySelector("audio");

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


fetch("track_count").then(r => r.json()).then(c => {
	document.querySelector('#next-track').addEventListener('click', () => loadTrack(c));
	document.querySelector('#skip').addEventListener('click', loadNextLevel);
	document.querySelector('#submit').addEventListener('click', () => submit(c));
	loadTrack(c);
});

let current_track;
let current_level;

async function loadTrack(track_count) {
	const id = Math.floor(Math.random() * track_count) + 1;
	const r = await fetch(`tracks/${id}.json`);
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

function submit(track_count) {
	if (title_search.value == current_track.track) {
		alert("Congratulations, you got it correctly.");
		loadTrack(track_count);
	} else {
		alert("Wrong answer.");
		loadNextLevel();
	}
	title_search.value = "";
	tracks_completion.innerHTML = "";
}
