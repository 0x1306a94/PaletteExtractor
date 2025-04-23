#include <fstream>
#include <iostream>

#include "palette.h"

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

int main(int argc, char **argv) {
    if (argc < 2) {
        std::cerr << "用法: " << argv[0] << " <image_path>" << std::endl;
        return 1;
    }

    int width, height, channels;
    uint8_t *data = stbi_load(argv[1], &width, &height, &channels, 0);
    if (!data) {
        std::cerr << "加载图片失败: " << argv[1] << std::endl;
        return 1;
    }

    int dataSize = width * height * channels;
    bool hasAlpha = (channels == 4);

    Swatches result = extractSwatches(data, dataSize, hasAlpha);

    auto printColor = [](const char *name, const RGB &c) {
        std::cout << name << ": #"
                  << std::hex << (int)c.r
                  << std::hex << (int)c.g
                  << std::hex << (int)c.b
                  << std::dec << std::endl;
    };

    printColor("Dominant", result.dominant);
    printColor("Vibrant", result.vibrant);
    printColor("LightVibrant", result.lightVibrant);
    printColor("DarkVibrant", result.darkVibrant);
    printColor("Muted", result.muted);
    printColor("LightMuted", result.lightMuted);
    printColor("DarkMuted", result.darkMuted);

    stbi_image_free(data);
    return 0;
}
