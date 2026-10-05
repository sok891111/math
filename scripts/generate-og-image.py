import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1200
HEIGHT = 630

# 1. Base Canvas & Gradient Background
img = Image.new('RGBA', (WIDTH, HEIGHT), (10, 15, 26, 255))
draw = ImageDraw.Draw(img)

# Deep space / sculk gradient
for y in range(HEIGHT):
    factor = y / HEIGHT
    if factor < 0.5:
        sub = factor / 0.5
        r = int(6 * (1 - sub) + 11 * sub)
        g = int(16 * (1 - sub) + 28 * sub)
        b = int(24 * (1 - sub) + 38 * sub)
    else:
        sub = (factor - 0.5) / 0.5
        r = int(11 * (1 - sub) + 5 * sub)
        g = int(28 * (1 - sub) + 10 * sub)
        b = int(38 * (1 - sub) + 16 * sub)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))

# Soft glowing halos
glow = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)

# Warden glow (teal/cyan)
glow_draw.ellipse([60, 60, 460, 500], fill=(0, 240, 255, 30))
glow_draw.ellipse([120, 130, 400, 430], fill=(52, 211, 153, 40))

# Right title glow (soft cyan & gold)
glow_draw.ellipse([600, 80, 1150, 360], fill=(0, 195, 255, 24))
glow_draw.ellipse([660, 260, 1120, 520], fill=(250, 204, 21, 18))

glow = glow.filter(ImageFilter.GaussianBlur(radius=65))
img = Image.alpha_composite(img, glow)
draw = ImageDraw.Draw(img)

# Grid lines for subtle retro-arcade feel
grid_color = (0, 240, 255, 10)
for x in range(0, WIDTH, 36):
    draw.line([(x, 0), (x, HEIGHT)], fill=grid_color, width=1)
for y in range(0, HEIGHT, 36):
    draw.line([(0, y), (WIDTH, y)], fill=grid_color, width=1)

# Frame border (Retro arcade screen style)
draw.rectangle([12, 12, WIDTH - 13, HEIGHT - 13], outline=(28, 38, 58, 255), width=4)
draw.rectangle([16, 16, WIDTH - 17, HEIGHT - 17], outline=(0, 240, 255, 80), width=2)

# Corner pixel accents
accent_c = (0, 240, 255, 240)
corner_size = 14
for cx, cy in [
    (16, 16),
    (WIDTH - 17 - corner_size, 16),
    (16, HEIGHT - 17 - corner_size),
    (WIDTH - 17 - corner_size, HEIGHT - 17 - corner_size)
]:
    draw.rectangle([cx, cy, cx + corner_size, cy + corner_size], fill=accent_c)

# 2. Draw Warden Character
SCALE = 4.6
WX = 245
WY = 470

def r_box(bx, by, bw, bh, hex_color, ox=WX, oy=WY, s=SCALE):
    c = tuple(int(hex_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)) + (255,)
    x0 = int(ox + bx * s)
    y0 = int(oy + by * s)
    x1 = int(ox + (bx + bw) * s)
    y1 = int(oy + (by + bh) * s)
    draw.rectangle([x0, y0, x1, y1], fill=c)

# Warden stage platform / shadow
draw.ellipse([WX - 150, WY - 15, WX + 150, WY + 40], fill=(4, 10, 16, 210))
draw.ellipse([WX - 110, WY - 8, WX + 110, WY + 30], fill=(0, 240, 255, 55))

# Warden body rects
r_box(-22, -54, 44, 39, '#12343b')
r_box(-27, -49, 11, 34, '#173e43')
r_box(17, -49, 11, 34, '#173e43')
r_box(-19, -17, 14, 17, '#102c34')
r_box(7, -17, 14, 17, '#102c34')
r_box(-21, -73, 42, 24, '#123139')
r_box(-14, -60, 28, 9, '#091d27')
r_box(-8, -57, 16, 3, '#527578')

# Horns / antennae
for side in [-1, 1]:
    r_box(-30 if side < 0 else 23, -78, 7, 25, '#2b8f94')
    r_box(-34 if side < 0 else 28, -82, 6, 11, '#8bc8b9')

# Chest plate
r_box(-13, -46, 26, 25, '#1d6870')
for i in range(3):
    r_box(-17, -45 + i * 8, 13, 4, '#b8c6ac')
    r_box(5, -45 + i * 8, 13, 4, '#b8c6ac')

# Glowing heart
r_box(-4, -41, 9, 17, '#72d5cc')
r_box(-2, -36, 5, 7, '#b7f0d9')

# Little Companion: Pink Pig next to Warden!
PX = 385
PY = 485
PS = 2.4
draw.ellipse([PX - 35, PY - 6, PX + 50, PY + 14], fill=(4, 10, 16, 180))
r_box(-19, -25, 33, 19, '#e6a0ae', ox=PX, oy=PY, s=PS)
r_box(5, -32, 17, 22, '#f0b3bd', ox=PX, oy=PY, s=PS)
r_box(5, -35, 6, 7, '#d68c9f', ox=PX, oy=PY, s=PS)
r_box(18, -24, 7, 10, '#d8889d', ox=PX, oy=PY, s=PS)
r_box(20, -21, 2, 3, '#975d71', ox=PX, oy=PY, s=PS)
r_box(12, -28, 4, 4, '#4a454b', ox=PX, oy=PY, s=PS)
for i in range(3):
    r_box(-15 + i * 13, -8, 6, 8, '#bd7f90', ox=PX, oy=PY, s=PS)

# Glowing particles
particles = [
    (WX - 110, WY - 280, 8, '#72d5cc'),
    (WX + 115, WY - 260, 9, '#b7f0d9'),
    (WX - 130, WY - 120, 6, '#34d399'),
    (WX + 130, WY - 150, 7, '#00f0ff'),
    (WX - 85, WY - 340, 6, '#8bc8b9'),
    (WX + 85, WY - 330, 8, '#72d5cc'),
    (WX - 140, WY - 40, 8, '#2b8f94'),
    (PX + 50, PY - 50, 7, '#facc15'),
]
for px, py, sz, col in particles:
    c = tuple(int(col.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)) + (220,)
    draw.rectangle([px, py, px + sz, py + sz], fill=c)

# 3. Typography & Right Content Area
font_path_gothic = '/System/Library/Fonts/AppleSDGothicNeo.ttc'

font_badge = ImageFont.truetype(font_path_gothic, 20, index=6)    # Bold
font_lead = ImageFont.truetype(font_path_gothic, 32, index=6)     # Bold
font_title = ImageFont.truetype(font_path_gothic, 52, index=16)   # Heavy
font_desc_1 = ImageFont.truetype(font_path_gothic, 25, index=4)   # SemiBold
font_desc_2 = ImageFont.truetype(font_path_gothic, 25, index=6)   # Bold
font_chip = ImageFont.truetype(font_path_gothic, 21, index=6)     # Bold
font_footer = ImageFont.truetype(font_path_gothic, 22, index=4)   # SemiBold
font_footer_b = ImageFont.truetype(font_path_gothic, 22, index=6) # Bold

RX = 490

# 3.1 Category Badge Pill
badge_text = "★ BLOCK ISLAND · 수 학 게 임 플 랫 폼 ★"
bbox = font_badge.getbbox(badge_text)
bw = (bbox[2] - bbox[0]) + 32
bh = 38
by = 78
draw.rounded_rectangle([RX, by, RX + bw, by + bh], radius=8, fill=(15, 38, 50, 230), outline=(0, 240, 255, 210), width=2)
draw.text((RX + 16, by + 7), badge_text, font=font_badge, fill=(0, 240, 255, 255))

# 3.2 Main Titles
draw.text((RX, 136), "아이들을 위한", font=font_lead, fill=(186, 230, 253, 255))
draw.text((RX, 180), "수학 게임 플랫폼", font=font_title, fill=(255, 255, 255, 255))

# Neon accent line
draw.rectangle([RX, 256, RX + 520, 260], fill=(0, 240, 255, 140))
draw.rectangle([RX, 256, RX + 180, 260], fill=(250, 204, 21, 255))

# 3.3 Description texts
draw.text((RX, 276), "신나는 마인크래프트 감성의 모험과 함께,", font=font_desc_1, fill=(226, 232, 240, 255))
draw.text((RX, 312), "자연스럽게 익히는 즐거운 10칸 블록 수학!", font=font_desc_2, fill=(253, 224, 71, 255))

# 3.4 Feature Chips (3 Games)
chips = [
    ("[1] 크래프트 러너", (14, 165, 233)),
    ("[2] 10칸 블록섬", (234, 179, 8)),
    ("[3] 워든의 동물공원", (16, 185, 129)),
]

chip_x = RX
chip_y = 368
for label, (cr, cg, cb) in chips:
    c_bbox = font_chip.getbbox(label)
    cw = (c_bbox[2] - c_bbox[0]) + 28
    ch = 44
    draw.rounded_rectangle([chip_x, chip_y, chip_x + cw, chip_y + ch], radius=10, fill=(int(cr*0.18), int(cg*0.18), int(cb*0.18), 245), outline=(cr, cg, cb, 230), width=2)
    draw.text((chip_x + 14, chip_y + 10), label, font=font_chip, fill=(255, 255, 255, 255))
    chip_x += cw + 14

# 3.5 Highlights Box
box_y = 442
box_w = 650
box_h = 96
draw.rounded_rectangle([RX, box_y, RX + box_w, box_y + box_h], radius=12, fill=(14, 20, 36, 235), outline=(45, 60, 85, 255), width=2)

draw.text((RX + 22, box_y + 16), "● 아이별 1:1 맞춤 진도 · 40여 종 모험 배지 보관함", font=font_footer, fill=(203, 213, 225, 255))
draw.text((RX + 22, box_y + 52), "● 아이패드 · 태블릿 · 스마트폰 · PC 터치 완벽 지원!", font=font_footer_b, fill=(52, 211, 153, 255))

# Save output
out_public = 'public/og-image.png'
img.save(out_public, 'PNG', optimize=True)
print(f"Successfully generated {out_public} ({WIDTH}x{HEIGHT})")
