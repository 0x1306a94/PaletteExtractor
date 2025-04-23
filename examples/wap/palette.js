function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h *= 60;
    }

    return { h, s, l };
}

function colorDistance(a, b) {
    return Math.sqrt(
        (a.r - b.r) ** 2 +
        (a.g - b.g) ** 2 +
        (a.b - b.b) ** 2
    );
}

function averageColor(colors) {
    const sum = colors.reduce((acc, c) => {
        acc.r += c.r;
        acc.g += c.g;
        acc.b += c.b;
        return acc;
    }, { r: 0, g: 0, b: 0 });

    const n = colors.length || 1;
    return {
        r: Math.round(sum.r / n),
        g: Math.round(sum.g / n),
        b: Math.round(sum.b / n)
    };
}

function classify(hsl) {
    if (hsl.s > 0.5) {
        if (hsl.l > 0.7) return 'lightVibrant';
        if (hsl.l < 0.3) return 'darkVibrant';
        return 'vibrant';
    } else {
        if (hsl.l > 0.7) return 'lightMuted';
        if (hsl.l < 0.3) return 'darkMuted';
        return 'muted';
    }
}

function extractSwatches(imageData, hasAlpha = false, k = 8) {
    const pixels = [];
    const stride = hasAlpha ? 4 : 3;

    for (let i = 0; i + stride <= imageData.length; i += stride) {
        if (hasAlpha && imageData[i + 3] < 128) continue;
        pixels.push({ r: imageData[i], g: imageData[i + 1], b: imageData[i + 2] });
    }

    if (pixels.length === 0) return {};

    // K-means clustering
    let centers = Array.from({ length: k }, () => pixels[Math.floor(Math.random() * pixels.length)]);
    for (let iter = 0; iter < 10; iter++) {
        const clusters = Array.from({ length: k }, () => []);
        for (const pixel of pixels) {
            let best = 0, minDist = colorDistance(pixel, centers[0]);
            for (let i = 1; i < k; i++) {
                const dist = colorDistance(pixel, centers[i]);
                if (dist < minDist) {
                    best = i;
                    minDist = dist;
                }
            }
            clusters[best].push(pixel);
        }
        centers = clusters.map(averageColor);
    }

    // Classify clusters
    const swatchCandidates = {};
    for (const c of centers) {
        const hsl = rgbToHsl(c);
        const type = classify(hsl);
        swatchCandidates[type] = { color: c, count: 0 };
    }

    for (const pixel of pixels) {
        let bestType = '';
        let bestDist = Infinity;
        for (const [type, data] of Object.entries(swatchCandidates)) {
            const dist = colorDistance(pixel, data.color);
            if (dist < bestDist) {
                bestDist = dist;
                bestType = type;
            }
        }
        if (bestType) swatchCandidates[bestType].count++;
    }

    // Determine dominant color
    const countMap = new Map();
    for (const pixel of pixels) {
        let nearest = centers[0];
        let minDist = colorDistance(pixel, nearest);
        for (const center of centers) {
            const dist = colorDistance(pixel, center);
            if (dist < minDist) {
                nearest = center;
                minDist = dist;
            }
        }
        const key = `${nearest.r},${nearest.g},${nearest.b}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
    }

    let dominant = centers[0], maxCount = 0;
    for (const [key, count] of countMap.entries()) {
        if (count > maxCount) {
            const [r, g, b] = key.split(',').map(Number);
            dominant = { r, g, b };
            maxCount = count;
        }
    }

    return {
        dominant,
        vibrant: swatchCandidates.vibrant?.color,
        lightVibrant: swatchCandidates.lightVibrant?.color,
        darkVibrant: swatchCandidates.darkVibrant?.color,
        muted: swatchCandidates.muted?.color,
        lightMuted: swatchCandidates.lightMuted?.color,
        darkMuted: swatchCandidates.darkMuted?.color
    };
}