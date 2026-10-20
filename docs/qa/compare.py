from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sources = root.parent / 'maquettes-v1'
target = root / 'qa'
for source, capture, name in [
    ('accueil-ordinateur.png', 'home-desktop.png', 'home'),
    ('accueil-mobile.png', 'home-mobile.png', 'mobile'),
    ('recherche-ordinateur.png', 'search-desktop.png', 'search'),
    ('fiche-bien-ordinateur.png', 'detail-desktop.png', 'detail'),
]:
    a = Image.open(sources / source).convert('RGB')
    b = Image.open(target / capture).convert('RGB')
    print(name, a.size, b.size)
    width = 650 if name != 'mobile' else 390
    a = a.resize((width, round(a.height * width / a.width)))
    b = b.resize((width, round(b.height * width / b.width)))
    board = Image.new('RGB', (width * 2, max(a.height, b.height)), 'white')
    board.paste(a, (0, 0))
    board.paste(b, (width, 0))
    board.save(target / f'{name}-comparison.jpg')
