#ifndef PALETTE_EXTRACTOR_PALETTE_H
#define PALETTE_EXTRACTOR_PALETTE_H

#include <cstdint>
#include <vector>

struct RGB {
    uint8_t r, g, b;
    
    bool operator<(const RGB &other) const {
        return std::tie(r, g, b) < std::tie(other.r, other.g, other.b);
    }
};

struct Swatches {
    RGB dominant;
    RGB vibrant;
    RGB lightVibrant;
    RGB darkVibrant;
    RGB muted;
    RGB lightMuted;
    RGB darkMuted;
};

// 支持 RGB / RGBA 输入数据
// imageData: 原始像素数据（按行排列）
// length: 数据长度（字节数）
// hasAlpha: true 表示每像素 4 字节（RGBA），false 表示每像素 3 字节（RGB）
// k: 聚类数量，默认值 8
Swatches extractSwatches(const uint8_t *imageData, int length, bool hasAlpha, int k = 8);

#endif
