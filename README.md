# Ambi

Ambi is a browser-based tool for creating 3D printable 3D [ambigrams](https://en.wikipedia.org/wiki/Ambigram) generated from two words of the same length.

Successor to [3dwords.rekettye.com](https://3dwords.rekettye.com/) ([GitHub link](https://github.com/ijanos/two-words-one-stl))

## Installation & development

Standard vite-based setup.

```sh
npm install
npm run dev # starts the development server
npm run build # builds the production bundle
npm run preview # starts a preview server with the production bundle
```



## TODOs & Ideas

Not in order of priority or importance.

- [x] Optional orthographic camera
- [x] Custom spacing between characters
- [x] Multiple font choices
- [x] Export to STL
- [x] Indicate loading status
- [x] Optional base platform with customizable height
- [x] Warnings for floating geometry
- [x] look at self loops (eg R in Roboto Slab)
- [ ] per-character spacing between characters?
- [ ] Custom font loading
- [ ] Persist custom fonts in local storage
- [ ] Use proper units (most likely mm); currently using arbitrary units 
- [ ] Add limits to camera zoom or add a camera home button
- [ ] Per-side font choices
- [ ] Cache glyphs instead of generating them all the time
- [ ] Parametrized tessellation for smoother meshes?
- [ ] Export to 3MF / something else?
- [ ] Shareable URLs 
- [ ] Playwright based tests? 
- [ ] Glyph height normalization? (ascenders and descenders can be cut off with some fonts)
- [ ] Show mesh statistics
- [ ] Emojis? How would that even work?
- [ ] Maybe per-character font choices?
- [ ] Add an about dialog and mention that this is client side only and I do no tracking no cookies no nothing. 
- [ ] Editing features in the 3D scene?
- [ ] Integrate with 3D printing services to order prints? 

## License

The source code in the repository is licensed under either of
  - Apache License, Version 2.0, (LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)
  - MIT license (LICENSE-MIT or http://opensource.org/licenses/MIT)

at your option.

Fonts have their own licenses. They are downloaded from [typefaces](https://github.com/components-ai/typefaces) or copied from Three.js.
