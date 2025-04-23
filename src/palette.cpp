#include "palette.h"
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <map>
#include <string>

struct HSL {
    float h, s, l;
};

static HSL rgbToHsl(RGB c) {
    float r = c.r / 255.0f;
    float g = c.g / 255.0f;
    float b = c.b / 255.0f;

    float maxVal = std::max({r, g, b});
    float minVal = std::min({r, g, b});
    float h = 0, s = 0, l = (maxVal + minVal) / 2.0f;

    if (maxVal != minVal) {
        float d = maxVal - minVal;
        s = l > 0.5f ? d / (2.0f - maxVal - minVal) : d / (maxVal + minVal);
        if (maxVal == r)
            h = (g - b) / d + (g < b ? 6 : 0);
        else if (maxVal == g)
            h = (b - r) / d + 2;
        else
            h = (r - g) / d + 4;
        h *= 60.0f;
    }

    return {h, s, l};
}

static float colorDistance(const RGB &a, const RGB &b) {
    return std::sqrt(
        (a.r - b.r) * (a.r - b.r) +
        (a.g - b.g) * (a.g - b.g) +
        (a.b - b.b) * (a.b - b.b));
}

static RGB averageColor(const std::vector<RGB> &colors) {
    if (colors.empty()) return {0, 0, 0};
    uint64_t r = 0, g = 0, b = 0;
    for (auto &c : colors) {
        r += c.r;
        g += c.g;
        b += c.b;
    }
    return {
        static_cast<uint8_t>(r / colors.size()),
        static_cast<uint8_t>(g / colors.size()),
        static_cast<uint8_t>(b / colors.size())};
}

static std::string classify(const HSL &hsl) {
    if (hsl.s > 0.5f) {
        if (hsl.l > 0.7f)
            return "lightVibrant";
        else if (hsl.l < 0.3f)
            return "darkVibrant";
        else
            return "vibrant";
    } else {
        if (hsl.l > 0.7f)
            return "lightMuted";
        else if (hsl.l < 0.3f)
            return "darkMuted";
        else
            return "muted";
    }
}

Swatches extractSwatches(const uint8_t *imageData, int length, bool hasAlpha, int k) {
    std::vector<RGB> pixels;
    int stride = hasAlpha ? 4 : 3;

    for (int i = 0; i + stride - 1 < length; i += stride) {
        if (hasAlpha && imageData[i + 3] < 128) continue;
        pixels.push_back({imageData[i], imageData[i + 1], imageData[i + 2]});
    }

    if (pixels.empty()) return {};

    std::vector<RGB> centers;
    for (int i = 0; i < k; ++i)
        centers.push_back(pixels[rand() % pixels.size()]);

    for (int iter = 0; iter < 10; ++iter) {
        std::vector<std::vector<RGB>> clusters(k);
        for (const auto &pixel : pixels) {
            int best = 0;
            float minDist = colorDistance(pixel, centers[0]);
            for (int i = 1; i < k; ++i) {
                float dist = colorDistance(pixel, centers[i]);
                if (dist < minDist) {
                    best = i;
                    minDist = dist;
                }
            }
            clusters[best].push_back(pixel);
        }

        for (int i = 0; i < k; ++i)
            centers[i] = averageColor(clusters[i]);
    }

    std::map<std::string, std::pair<RGB, int>> swatchCandidates;
    for (const auto &c : centers) {
        HSL hsl = rgbToHsl(c);
        std::string type = classify(hsl);
        swatchCandidates[type] = {c, 0};
    }

    for (const auto &pixel : pixels) {
        float bestDist = 1e6;
        std::string bestType;
        for (const auto &[type, pair] : swatchCandidates) {
            float dist = colorDistance(pixel, pair.first);
            if (dist < bestDist) {
                bestDist = dist;
                bestType = type;
            }
        }
        if (!bestType.empty())
            swatchCandidates[bestType].second++;
    }

    std::map<RGB, int> countMap;
    for (const auto &pixel : pixels) {
        RGB nearest = centers[0];
        float minDist = colorDistance(pixel, nearest);
        for (const auto &center : centers) {
            float dist = colorDistance(pixel, center);
            if (dist < minDist) {
                nearest = center;
                minDist = dist;
            }
        }
        countMap[nearest]++;
    }

    RGB dominant = centers[0];
    int maxCount = 0;
    for (auto &[color, count] : countMap) {
        if (count > maxCount) {
            dominant = color;
            maxCount = count;
        }
    }

    Swatches out = {dominant};
    for (const auto &[type, pair] : swatchCandidates) {
        if (type == "vibrant")
            out.vibrant = pair.first;
        else if (type == "lightVibrant")
            out.lightVibrant = pair.first;
        else if (type == "darkVibrant")
            out.darkVibrant = pair.first;
        else if (type == "muted")
            out.muted = pair.first;
        else if (type == "lightMuted")
            out.lightMuted = pair.first;
        else if (type == "darkMuted")
            out.darkMuted = pair.first;
    }

    return out;
}
