const PaletteAndroidX = {};

PaletteAndroidX.Swatch = class {
    constructor(rgb, population) {
        if (!Array.isArray(rgb) || rgb.length !== 3 || rgb.some(v => !Number.isInteger(v) || v < 0 || v > 255)) {
            throw new Error('Invalid RGB values');
        }
        this._rgb = rgb;
        this._population = population;
        this._hsl = this.rgbToHsl(rgb);
        this._titleTextColor = this.calculateTextColor(rgb, 4.5);
        this._bodyTextColor = this.calculateTextColor(rgb, 3.0);
    }

    getRgb() { return this._rgb; }
    getHsl() { return this._hsl; }
    getPopulation() { return this._population; }
    getTitleTextColor() { return this._titleTextColor; }
    getBodyTextColor() { return this._bodyTextColor; }

    rgbToHsl([r, g, b]) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    calculateTextColor(rgb, minContrast) {
        const luminance = this.getLuminance(rgb);
        const whiteLuminance = 1.0;
        const contrastWithWhite = (whiteLuminance + 0.05) / (luminance + 0.05);
        return contrastWithWhite >= minContrast ? [255, 255, 255] : [0, 0, 0];
    }

    getLuminance([r, g, b]) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
};

PaletteAndroidX.Target = class {
    constructor() {
        this._saturationTargets = [0.55, 0.5, 1.0];
        this._lightnessTargets = [0.45, 0.5, 0.7];
        this._weight = 1.0;
    }

    getMinimumSaturation() { return this._saturationTargets[0]; }
    getTargetSaturation() { return this._saturationTargets[1]; }
    getMaximumSaturation() { return this._saturationTargets[2]; }
    getMinimumLightness() { return this._lightnessTargets[0]; }
    getTargetLightness() { return this._lightnessTargets[1]; }
    getMaximumLightness() { return this._lightnessTargets[2]; }
    getWeight() { return this._weight; }
};

PaletteAndroidX.Target.VIBRANT = new PaletteAndroidX.Target();
PaletteAndroidX.Target.VIBRANT._saturationTargets = [0.35, 1.0, 1.0];
PaletteAndroidX.Target.VIBRANT._lightnessTargets = [0.3, 0.5, 0.7];

PaletteAndroidX.Target.LIGHT_VIBRANT = new PaletteAndroidX.Target();
PaletteAndroidX.Target.LIGHT_VIBRANT._saturationTargets = [0.35, 1.0, 1.0];
PaletteAndroidX.Target.LIGHT_VIBRANT._lightnessTargets = [0.74, 0.85, 1.0];

PaletteAndroidX.Target.DARK_VIBRANT = new PaletteAndroidX.Target();
PaletteAndroidX.Target.DARK_VIBRANT._saturationTargets = [0.35, 1.0, 1.0];
PaletteAndroidX.Target.DARK_VIBRANT._lightnessTargets = [0.0, 0.3, 0.45];

PaletteAndroidX.Target.MUTED = new PaletteAndroidX.Target();
PaletteAndroidX.Target.MUTED._saturationTargets = [0.0, 0.3, 0.4];
PaletteAndroidX.Target.MUTED._lightnessTargets = [0.3, 0.5, 0.7];

PaletteAndroidX.Target.LIGHT_MUTED = new PaletteAndroidX.Target();
PaletteAndroidX.Target.LIGHT_MUTED._saturationTargets = [0.0, 0.3, 0.4];
PaletteAndroidX.Target.LIGHT_MUTED._lightnessTargets = [0.74, 0.85, 1.0];

PaletteAndroidX.Target.DARK_MUTED = new PaletteAndroidX.Target();
PaletteAndroidX.Target.DARK_MUTED._saturationTargets = [0.0, 0.3, 0.4];
PaletteAndroidX.Target.DARK_MUTED._lightnessTargets = [0.0, 0.3, 0.45];

PaletteAndroidX.Palette = class {
    constructor(swatches, targets) {
        this._swatches = swatches;
        this._targets = targets;
        this._selectedSwatches = new Map();
        this.generateSwatches();
    }

    generateSwatches() {
        for (const target of this._targets) {
            let bestSwatch = null;
            let bestScore = -Infinity;
            for (const swatch of this._swatches) {
                const score = this.scoreSwatch(swatch, target);
                if (score > bestScore) {
                    bestScore = score;
                    bestSwatch = swatch;
                }
            }
            if (bestSwatch) {
                this._selectedSwatches.set(target, bestSwatch);
            }
        }
    }

    scoreSwatch(swatch, target) {
        const [h, s, l] = swatch.getHsl();
        const sWeight = 0.5, lWeight = 0.5;
        const sScore = (1 - Math.abs(s - target.getTargetSaturation())) * sWeight;
        const lScore = (1 - Math.abs(l - target.getTargetLightness())) * lWeight;
        return sScore + lScore;
    }

    getSwatches() { return this._swatches; }
    getVibrantSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.VIBRANT) || null; }
    getLightVibrantSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.LIGHT_VIBRANT) || null; }
    getDarkVibrantSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.DARK_VIBRANT) || null; }
    getMutedSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.MUTED) || null; }
    getLightMutedSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.LIGHT_MUTED) || null; }
    getDarkMutedSwatch() { return this._selectedSwatches.get(PaletteAndroidX.Target.DARK_MUTED) || null; }
    getSwatchForTarget(target) { return this._selectedSwatches.get(target) || null; }

    // 添加 getDominantSwatch 方法
    getDominantSwatch() {
        let dominant = null;
        let maxPopulation = 0;
        for (const swatch of this._swatches) {
            const population = swatch.getPopulation();
            if (population > maxPopulation) {
                maxPopulation = population;
                dominant = swatch;
            }
        }
        return dominant;
    }

    static from(bitmap) {
        return new PaletteAndroidX.PaletteBuilder(bitmap);
    }
};

PaletteAndroidX.PaletteBuilder = class {
    constructor(bitmap) {
        if (!(bitmap instanceof ImageData)) {
            throw new Error('Bitmap must be an ImageData object');
        }
        this._bitmap = bitmap;
        this._maxColors = 16;
        this._filters = [PaletteAndroidX.PaletteBuilder.DEFAULT_FILTER];
        this._region = null;
        this._resizeArea = 112 * 112;
        this._targets = [
            PaletteAndroidX.Target.VIBRANT,
            PaletteAndroidX.Target.LIGHT_VIBRANT,
            PaletteAndroidX.Target.DARK_VIBRANT,
            PaletteAndroidX.Target.MUTED,
            PaletteAndroidX.Target.LIGHT_MUTED,
            PaletteAndroidX.Target.DARK_MUTED
        ];
    }

    static DEFAULT_FILTER([r, g, b]) {
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.05 && luminance < 0.95;
    }

    maximumColorCount(count) {
        if (count < 1) throw new Error('Maximum color count must be > 0');
        this._maxColors = count;
        return this;
    }

    addFilter(filter) {
        if (typeof filter !== 'function') throw new Error('Filter must be a function');
        this._filters.push(filter);
        return this;
    }

    clearFilters() {
        this._filters = [];
        return this;
    }

    setRegion(left, top, right, bottom) {
        if (left < 0 || top < 0 || right <= left || bottom <= top ||
            right > this._bitmap.width || bottom > this._bitmap.height) {
            throw new Error('Invalid region');
        }
        this._region = { left, top, right, bottom };
        return this;
    }

    clearRegion() {
        this._region = null;
        return this;
    }

    resizeBitmapArea(area) {
        if (area <= 0) throw new Error('Resize area must be > 0');
        this._resizeArea = area;
        return this;
    }

    addTarget(target) {
        if (!(target instanceof PaletteAndroidX.Target)) throw new Error('Target must be an instance of Target');
        this._targets.push(target);
        return this;
    }

    clearTargets() {
        this._targets = [];
        return this;
    }

    generate(callback) {
        if (callback) {
            this.asyncGenerate(callback);
            return undefined;
        } else {
            return this.syncGenerate();
        }
    }

    syncGenerate() {
        const data = this._bitmap.data;
        const width = this._bitmap.width;
        const height = this._bitmap.height;
        const region = this._region || { left: 0, top: 0, right: width, bottom: height };

        if (region.right <= region.left || region.bottom <= region.top) {
            console.warn('Invalid region, using full image');
            region.left = 0;
            region.top = 0;
            region.right = width;
            region.bottom = height;
        }

        const regionData = [];
        for (let y = region.top; y < region.bottom; y++) {
            for (let x = region.left; x < region.right; x++) {
                const i = (y * width + x) * 4;
                regionData.push(data[i], data[i + 1], data[i + 2], data[i + 3]);
            }
        }

        if (regionData.length === 0) {
            console.warn('No valid pixels in region');
            return new PaletteAndroidX.Palette([], this._targets);
        }

        const colors = this.quantizeColors(new Uint8ClampedArray(regionData));
        const swatches = colors.map(([r, g, b, count]) => {
            const safeR = Math.max(0, Math.min(255, Math.round(r)));
            const safeG = Math.max(0, Math.min(255, Math.round(g)));
            const safeB = Math.max(0, Math.min(255, Math.round(b)));
            return new PaletteAndroidX.Swatch([safeR, safeG, safeB], count);
        });
        return new PaletteAndroidX.Palette(swatches, this._targets);
    }

    asyncGenerate(callback) {
        setTimeout(() => {
            try {
                const palette = this.syncGenerate();
                callback(palette);
            } catch (e) {
                console.error('Palette generation failed:', e);
            }
        }, 0);
    }

    quantizeColors(imageData) {
        const colorMap = new Map();
        for (let i = 0; i < imageData.length; i += 4) {
            const r = Math.round(imageData[i] / 8) * 8;
            const g = Math.round(imageData[i + 1] / 8) * 8;
            const b = Math.round(imageData[i + 2] / 8) * 8;
            if (isNaN(r) || isNaN(g) || isNaN(b)) continue;
            if (this._filters.every(filter => filter([r, g, b]))) {
                const key = `${r},${g},${b}`;
                colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }
        }

        if (colorMap.size === 0) {
            console.warn('No valid colors after filtering');
            return [];
        }

        let colors = Array.from(colorMap.entries())
            .map(([key, count]) => [...key.split(',').map(Number), count])
            .sort((a, b) => b[3] - a[3])
            .slice(0, this._maxColors);

        while (colors.length > this._maxColors) {
            const closestPair = this.findClosestPair(colors);
            const merged = this.mergeColors(closestPair[0], closestPair[1]);
            colors = colors.filter(c => c !== closestPair[0] && c !== closestPair[1]);
            colors.push(merged);
        }

        return colors;
    }

    findClosestPair(colors) {
        let minDistance = Infinity;
        let pair = [colors[0], colors[1]];
        for (let i = 0; i < colors.length; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                const distance = this.colorDistance(colors[i], colors[j]);
                if (distance < minDistance && !isNaN(distance)) {
                    minDistance = distance;
                    pair = [colors[i], colors[j]];
                }
            }
        }
        return pair;
    }

    colorDistance(c1, c2) {
        const dr = c1[0] - c2[0];
        const dg = c1[1] - c2[1];
        const db = c1[2] - c2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    mergeColors(c1, c2) {
        const totalPopulation = c1[3] + c2[3];
        if (totalPopulation === 0) {
            console.warn('Zero population in mergeColors, returning first color');
            return [c1[0], c1[1], c1[2], 0];
        }
        const r = (c1[0] * c1[3] + c2[0] * c2[3]) / totalPopulation;
        const g = (c1[1] * c1[3] + c2[1] * c2[3]) / totalPopulation;
        const b = (c1[2] * c1[3] + c2[2] * c2[3]) / totalPopulation;
        return [
            Math.max(0, Math.min(255, Math.round(r))),
            Math.max(0, Math.min(255, Math.round(g))),
            Math.max(0, Math.min(255, Math.round(b))),
            totalPopulation
        ];
    }
};

PaletteAndroidX.extractSwatches = function(imageData, numSwatches, options = {}) {
    if (!(imageData instanceof ImageData)) {
        throw new Error('imageData must be an ImageData object');
    }
    if (!Number.isInteger(numSwatches) || numSwatches < 1) {
        throw new Error('numSwatches must be a positive integer');
    }

    let builder = PaletteAndroidX.Palette.from(imageData).maximumColorCount(numSwatches);

    if (options.filters) {
        builder.clearFilters();
        options.filters.forEach(filter => builder.addFilter(filter));
    }
    if (options.region) {
        const { left, top, right, bottom } = options.region;
        builder.setRegion(left, top, right, bottom);
    }
    if (options.resizeArea) {
        builder.resizeBitmapArea(options.resizeArea);
    }
    if (options.targets) {
        builder.clearTargets();
        options.targets.forEach(target => builder.addTarget(target));
    }

    const palette = builder.generate();

    const swatches = {
        dominant: palette.getDominantSwatch(),
        vibrant: palette.getVibrantSwatch(),
        lightVibrant: palette.getLightVibrantSwatch(),
        darkVibrant: palette.getDarkVibrantSwatch(),
        muted: palette.getMutedSwatch(),
        lightMuted: palette.getLightMutedSwatch(),
        darkMuted: palette.getDarkMutedSwatch()
    };

    const result = {};
    for (const [key, swatch] of Object.entries(swatches)) {
        if (swatch) {
            const [r, g, b] = swatch.getRgb();
            result[key] = {
                r,
                g,
                b,
                textColor: swatch.getTitleTextColor()
            };
        }
    }

    return result;
};