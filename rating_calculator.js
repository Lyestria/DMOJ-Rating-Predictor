//Original Source From: https://github.com/DMOJ/online-judge/blob/master/judge/ratings.py
function erf(x) {
	// save the sign of x
	var sign = (x >= 0) ? 1 : -1;
	x = Math.abs(x);

	// constants
	var a1 = 0.254829592;
	var a2 = -0.284496736;
	var a3 = 1.421413741;
	var a4 = -1.453152027;
	var a5 = 1.061405429;
	var p = 0.3275911;

	// A&S formula 7.1.26
	var t = 1.0 / (1.0 + p * x);
	var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
	return sign * y; // erf(-x) = -erf(x);
}

function rational_approximation(t) {
	c = [2.515517, 0.802853, 0.010328];
	d = [1.432788, 0.189269, 0.001308];
	numerator = (c[2] * t + c[1]) * t + c[0];
	denominator = ((d[2] * t + d[1]) * t + d[0]) * t + 1.0;
	return t - numerator / denominator;
}

function normal_CDF_inverse(p) {
	if (p < 0.5) return -rational_approximation(Math.sqrt(-2.0 * Math.log(p)));
	else return rational_approximation(Math.sqrt(-2.0 * Math.log(1.0 - p)));
}

function WP(RA, RB, VA, VB) {
	return (erf((RB - RA) / Math.sqrt(2 * (VA * VA + VB * VB))) + 1) / 2.0;
}

function recalculate_ratings(old_rating, old_volatility, actual_rank, times_rated) {
	N = old_rating.length;
	var new_rating = [...old_rating];
	if (N <= 1) return new_rating;

	ave_rating = old_rating.reduce((a, c) => a + c) / N;
	sum1 = old_volatility.reduce((a, c) => a + c ** 2) / N;
	sum2 = old_rating.reduce((a, c) => a + (c - ave_rating) ** 2) / (N - 1);
	CF = Math.sqrt(sum1 + sum2);

	for (var i = 0; i < N; i++) {
		ERank = 0.5;
		for (var j = 0; j < N; j++) {
			ERank += WP(old_rating[i], old_rating[j], old_volatility[i], old_volatility[j]);
		}

		EPerf = -normal_CDF_inverse((ERank - 0.5) / N);
		APerf = -normal_CDF_inverse((actual_rank[i] - 0.5) / N);
		PerfAs = old_rating[i] + CF * (APerf - EPerf);
		Weight = 1.0 / (1 - (0.42 / (times_rated[i] + 1) + 0.18)) - 1.0;
		if (old_rating[i] > 2500) Weight *= 0.8;
		else if (old_rating[i] >= 2000) Weight *= 0.9;

		Cap = 150.0 + 1500.0 / (times_rated[i] + 2);

		new_rating[i] = (old_rating[i] + Weight * PerfAs) / (1.0 + Weight);
		if (Math.abs(old_rating[i] - new_rating[i]) > Cap) {
			if (old_rating[i] < new_rating[i]) new_rating[i] = old_rating[i] + Cap;
			else new_rating[i] = old_rating[i] - Cap;
		}
	}

	adjust = (old_rating.reduce((a, c) => a + c) - new_rating.reduce((a, c) => a + c)) / N;
	for (var i = 0; i < N; i++) new_rating[i] += adjust;

	best_rank = Math.min(...actual_rank);
	for (var i = 0; i < N; i++) if (Math.abs(actual_rank[i] - best_rank) <= 1e-3 && new_rating[i] < old_rating[i] + 1) new_rating[i] = old_rating[i] + 1;
	return new_rating.map(Math.round);
}