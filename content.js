async function getJSON(url) {
	let res = await fetch(url);
	return await res.json();
}

function assign_ranks(ranks, len) {
	var rk = (ranks.length + len-1) * 0.5 + 1;
	while (ranks.length < len) ranks.push(rk);
}

var times = {};
async function get_time(code){
	if (times[code] !== undefined) return times[code];
	obj = await getJSON("https://dmoj.ca/api/contest/info/" + code);
	return times[code] = new Date(obj.end_time);
}
async function do_stuff() {
	var path = window.location.pathname;
	var segs = path.split('/');
	var code = segs[segs.length - 3];
	console.log(code);

	var obj = await getJSON("https://dmoj.ca/api/contest/info/" + code)
	var ranking = obj.rankings;
	var n = ranking.length;
	var old_rating = Array(), old_volatility = Array(), ranks = Array(), times_rated = Array(), new_ind = Array(n);
	var curTime = new Date(obj.end_time);

	var lastEqual = -1;

	for (var i = 0, ind = 0; i < n; i++) {
		var num = 0;
		ranking[i].solutions.forEach(sol => num += sol !== null);
		if (num == 0) continue;
		new_ind[i] = ind;

		if (lastEqual == -1 || ranking[i].points != ranking[lastEqual].points || ranking[i].cumtime != ranking[lastEqual].cumtime) {
			assign_ranks(ranks, old_rating.length);
			lastEqual = i;
		}
		old_rating.push(0), old_volatility.push(0), times_rated.push(0);

		var username = ranking[i].user;
		var contests = (await getJSON("https://dmoj.ca/api/user/info/" + username)).contests;
		old_rating[ind] = 1200;
		old_volatility[ind] = 535;
		times_rated[ind] = 0;
		recentTime = new Date(-100000000000000);
		for (var contest in contests.history) {
			if (contests.history[contest].rating === null) continue;
			var time = await get_time(contest);
			if (time >= curTime) continue;
			times_rated[ind]++;
			if (time > recentTime) {
				old_rating[ind] = contests.history[contest].rating;
				old_volatility[ind] = contests.history[contest].volatility;
			}
		}
		ind++;
	}
	assign_ranks(ranks, old_rating.length);

	var new_rating = recalculate_ratings(old_rating, old_volatility, ranks, times_rated);

	var deltas = Array(n);
	for (var i = 0; i < n; i++)deltas[i] = new_ind[i] === undefined ? 0 : new_rating[new_ind[i]] - old_rating[new_ind[i]];

	console.log(deltas);

	$('#users-table').children().eq(0).children().eq(0).append("<th class=\"rank\">+</th>");
	var rows = $('#users-table').children().eq(1).children();
	for (var i = 0; i < n; i++) {
		var el;
		if (deltas[i] > 0) el = "<td class=\"full-score\">+" + deltas[i] + "</td>";
		else if (deltas[i] < 0) el = "<td class=\"failed-score\">" + deltas[i] + "</td>";
		else el = "<td class=\"user-points\">0</td>";
		rows.eq(i).append(el);
	}

	console.log(old_rating);
	console.log(old_volatility);
	console.log(times_rated);
	console.log(deltas.reduce((a, c) => a + c));
}
do_stuff();