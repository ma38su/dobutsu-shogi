from PIL import Image, ImageFilter

base = Image.open("public/pieces/sweets/mix/chick.png").convert("RGBA")
surface = Image.open("/tmp/strawberry-surface.png").convert("RGBA")
base_box = base.getchannel("A").getbbox()
surface_box = surface.getchannel("A").getbbox()

surface_crop = surface.crop(surface_box).resize(
    (base_box[2] - base_box[0], base_box[3] - base_box[1]),
    Image.Resampling.LANCZOS,
)
surface_layer = Image.new("RGBA", base.size)
surface_layer.paste(surface_crop, (base_box[0], base_box[1]), surface_crop)

alpha = base.getchannel("A")
interior_mask = alpha.filter(ImageFilter.MinFilter(25))

result = Image.composite(surface_layer, base, interior_mask)
result.putalpha(alpha)
result.save("public/pieces/sweets/mix/hen.png")

print("base_bbox", base_box)
print("result_bbox", result.getchannel("A").getbbox())
