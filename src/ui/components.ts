 export const text= {
  "Split Text": {
    "description": "GSAP SplitText is a utility that breaks text into smaller units (chars, words, or lines) so you can animate each piece separately with GSAP, enabling staggered reveals, masking, and precise timing control.",
    "codesnippet": "import { SplitText } from 'gsap/SplitText';\nimport gsap from 'gsap';\n\nconst handleAnimationComplete = () => {\n  console.log('All letters have animated!');\n};\n\n<SplitText\n  text='Hello, GSAP!'\n  className='text-2xl font-semibold text-center'\n  delay={100}\n  duration={0.6}\n  ease='power3.out'\n  splitType='chars'\n  from={{ opacity: 0, y: 40 }}\n  to={{ opacity: 1, y: 0 }}\n  threshold={0.1}\n  rootMargin='-100px'\n  textAlign='center'\n  onLetterAnimationComplete={handleAnimationComplete}\n/>",
    "dependencies":"npm install gsap @gsap/react"
  },
  "Blur Text":{
    "description": "BlurText is a component that animates text by applying blur and directional motion effects. You can choose to animate by words or characters, set animation delay, and control the animation direction for dynamic text reveals.",
    "codesnippet": "import BlurText from './BlurText';\n\nconst handleAnimationComplete = () => {\n  console.log('Animation completed!');\n};\n\n<BlurText\n  text=\"Isn't this so cool?!\"\n  delay={150}\n  animateBy='words'\n  direction='top'\n  onAnimationComplete={handleAnimationComplete}\n  className='text-2xl mb-8'\n/>",
    "dependencies":"npm install motion"
  },
  "Circular Text": {
    "description": "CircularText is a component that arranges text along a circular path and applies rotation or motion effects. It can respond to hover interactions by speeding up or altering animation behavior, creating an engaging circular motion for text-based designs.",
    "codesnippet": "import CircularText from './CircularText';\n  \n<CircularText\n  text='REACT*BITS*COMPONENTS*'\n  onHover='speedUp'\n  spinDuration={20}\n  className='custom-class'\n/>",
    "dependencies": "npm install motion"
  },
  "Shuffle": {
    "description": "Shuffle is a text animation component that rearranges or shuffles characters or words dynamically. It supports directional animation, hover triggering, easing control, and reduced motion preferences for accessibility-friendly text effects.",
    "codesnippet": "import Shuffle from './Shuffle';\n\n<Shuffle\n  text='Hello World'\n  shuffleDirection='right'\n  duration={0.35}\n  animationMode='evenodd'\n  shuffleTimes={1}\n  ease='power3.out'\n  stagger={0.03}\n  threshold={0.1}\n  triggerOnce={true}\n  triggerOnHover={true}\n  respectReducedMotion={true}\n/>",
    "dependencies": "npm install gsap @gsap/react"
  },
   "Shiny Text": {
    "description": "Shiny Text adds a metallic sheen animation effect sweeping across text, creating a reflective and glowing highlight that makes the text stand out.",
    "codesnippet": "import ShinyText from './ShinyText';\n\n<ShinyText \n  text='Just some shiny text!' \n  disabled={false} \n  speed={3} \n  className='custom-class' \n/>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/ShinyText-TS-CSS"
  },
  "Text Pressure": {
    "description": "Text Pressure animates text with dynamic pressure effects on characters or words, allowing control of boldness, width, slant, stroke, and color for a lively, responsive text display.",
    "codesnippet": "import TextPressure from './TextPressure';\n\n<div style={{position: 'relative', height: '300px'}}>\n  <TextPressure\n    text='Hello!'\n    flex={true}\n    alpha={false}\n    stroke={false}\n    width={true}\n    weight={true}\n    italic={true}\n    textColor='#ffffff'\n    strokeColor='#ff0000'\n    minFontSize={36}\n  />\n</div>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/TextPressure-TS-CSS"
  },
  "Curved Loop": {
    "description": "Curved Loop displays text along a smooth curved path with marquee animation and optional interaction. It supports speed, direction, curve amount, and user interaction settings for creative text effects.",
    "codesnippet": "import CurvedLoop from './CurvedLoop';\n\n<CurvedLoop marqueeText='Welcome to React Bits ✦' />\n\n// With custom props\n<CurvedLoop \n  marqueeText='Be ✦ Creative ✦ With ✦ React ✦ Bits ✦'\n  speed={3}\n  curveAmount={500}\n  direction='right'\n  interactive={true}\n  className='custom-text-style'\n/>\n\n// Non-interactive slow version\n<CurvedLoop \n  marqueeText='Smooth Curved Animation'\n  speed={1}\n  curveAmount={300}\n  interactive={false}\n/>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/CurvedLoop-TS-CSS"
  },
  "Fuzzy Text": {
    "description": "Fuzzy Text creates a vibrating, fuzzy animation effect on text. It lets you control the base vibration intensity and how strong the effect becomes when hovered, providing dynamic, eye-catching text.",
    "codesnippet": "import FuzzyText from './FuzzyText';\n\n<FuzzyText \n  baseIntensity={0.2} \n  hoverIntensity={hoverIntensity} \n  enableHover={enableHover}>\n  404\n</FuzzyText>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/FuzzyText-TS-CSS"
  },
  "Gradient Text": {
    "description": "Gradient Text renders text with a smooth linear gradient animation cycling through multiple colors. It supports animation speed, border toggling, and custom styling to add colorful flair to any text.",
    "codesnippet": "import GradientText from './GradientText';\n\n<GradientText\n  colors={[\"#40ffaa\", \"#4079ff\", \"#40ffaa\", \"#4079ff\", \"#40ffaa\"]}\n  animationSpeed={3}\n  showBorder={false}\n  className=\"custom-class\"\n>\n  Add a splash of color!\n</GradientText>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/GradientText-TS-CSS"
  },
  "Text Cursor": {
    "description": "Text Cursor is a text animation component that animates a cursor or pointer effect following the text with customizable delay, spacing, exit speed, and whether it moves aligned to mouse direction or randomly for a lively typing experience.",
    "codesnippet": "import TextCursor from './TextCursor';\n\n<TextCursor\n  text=\"Hello!\"\n  delay={0.01}\n  spacing={80}\n  followMouseDirection={true}\n  randomFloat={true}\n  exitDuration={0.3}\n  removalInterval={20}\n  maxPoints={10}\n/>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/TextCursor-TS-CSS"
  },
  "Decrypted Text": {
    "description": "Decrypted Text animates text revealing by 'decrypting' characters with a flickering effect. It supports hover-triggered reveal, speed control, custom character sets, and animation trigger based on view scrolling.",
    "codesnippet": "import DecryptedText from './DecryptedText';\n\n<DecryptedText text=\"Hover me!\" />\n\n<DecryptedText\n  text=\"Customize me\"\n  speed={100}\n  maxIterations={20}\n  characters=\"ABCD1234!?\"\n  className=\"revealed\"\n  parentClassName=\"all-letters\"\n  encryptedClassName=\"encrypted\"\n/>\n\n<div style={{ marginTop: '4rem' }}>\n  <DecryptedText\n    text=\"This text animates when in view\"\n    animateOn=\"view\"\n    revealDirection=\"center\"\n  />\n</div>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/DecryptedText-TS-CSS"
  },
  "True Focus": {
    "description": "True Focus animates sentences by adding blur and focus transitions, with options to manually control animation, blur amount, border color, animation duration, and pauses between cycles.",
    "codesnippet": "import TrueFocus from './TrueFocus';\n\n<TrueFocus \n  sentence=\"True Focus\"\n  manualMode={false}\n  blurAmount={5}\n  borderColor=\"red\"\n  animationDuration={2}\n  pauseBetweenAnimations={1}\n/>",
    "dependencies": "npm install motion"
  },
  "Rotating Text": {
    "description": "Rotating Text cycles through an array of strings with smooth vertical slide transitions. Supports staggered animation, spring motion, rotation interval, and custom class styling for dynamic, engaging text presentations.",
    "codesnippet": "import RotatingText from './RotatingText';\n\n<RotatingText\n  texts={['React', 'Bits', 'Is', 'Cool!']}\n  mainClassName=\"px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg\"\n  staggerFrom={'last'}\n  initial={{ y: '100%' }}\n  animate={{ y: 0 }}\n  exit={{ y: '-120%' }}\n  staggerDuration={0.025}\n  splitLevelClassName=\"overflow-hidden pb-0.5 sm:pb-1 md:pb-1\"\n  transition={{ type: 'spring', damping: 30, stiffness: 400 }}\n  rotationInterval={2000}\n/>",
    "dependencies": "npm install motion"
  },
  "Pixel Transition": {
    "description": "Pixel Transition creates a pixelated transition effect between two different contents. Configure grid size, pixel color, animation step duration, and custom content for smooth pixel-based content reveals.",
    "codesnippet": "import PixelTransition from './PixelTransition';\n\n<PixelTransition\n  firstContent={\n    <img\n      src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg\"\n      alt=\"default pixel transition content, a cat!\"\n      style={{ width: '100%', height: '100%', objectFit: 'cover' }}\n    />\n  }\n  secondContent={\n    <div\n      style={{\n        width: '100%',\n        height: '100%',\n        display: 'grid',\n        placeItems: 'center',\n        backgroundColor: '#111'\n      }}\n    >\n      <p style={{ fontWeight: 900, fontSize: '3rem', color: '#ffffff' }}>Meow!</p>\n    </div>\n  }\n  gridSize={12}\n  pixelColor='#ffffff'\n  animationStepDuration={0.4}\n  className=\"custom-pixel-card\"\n/>",
    "dependencies": "npm install gsap"
  },
  "Target Cursor": {
    "description": "Target Cursor adds an animated spinning cursor to enhance UI interaction. Supports duration and optional hiding of the default system cursor with customizable styles.",
    "codesnippet": "import TargetCursor from './TargetCursor';\n\nexport default function App() {\n  return (\n    <div>\n      <TargetCursor \n        spinDuration={2}\n        hideDefaultCursor={true}\n      />\n      \n      <h1>Hover over the elements below</h1>\n      <button className=\"cursor-target\">Click me!</button>\n      <div className=\"cursor-target\">Hover target</div>\n    </div>\n  );\n}",
    "dependencies": "npm install gsap"
  },
  "Laser Flow": {
    "description": "Laser Flow is a visually striking animated shader effect that produces flowing beams of light with customizable colors and offsets. It supports interactive image reveal effects tied to mouse movements for engaging UI displays.",
    "codesnippet": "import LaserFlow from './LaserFlow';\nimport { useRef } from 'react';\n\n// Basic usage\n<div style={{ height: '500px', position: 'relative', overflow: 'hidden' }}>\n  <LaserFlow />\n</div>\n\n// Image Example Interactive Reveal Effect\nfunction LaserFlowBoxExample() {\n  const revealImgRef = useRef(null);\n\n  return (\n    <div \n      style={{ \n        height: '800px', \n        position: 'relative', \n        overflow: 'hidden',\n        backgroundColor: '#060010'\n      }}\n      onMouseMove={(e) => {\n        const rect = e.currentTarget.getBoundingClientRect();\n        const x = e.clientX - rect.left;\n        const y = e.clientY - rect.top;\n        const el = revealImgRef.current;\n        if (el) {\n          el.style.setProperty('--mx', `${x}px`);\n          el.style.setProperty('--my', `${y + rect.height * 0.5}px`);\n        }\n      }}\n      onMouseLeave={() => {\n        const el = revealImgRef.current;\n        if (el) {\n          el.style.setProperty('--mx', '-9999px');\n          el.style.setProperty('--my', '-9999px');\n        }\n      }}\n    >\n      <LaserFlow\n        horizontalBeamOffset={0.1}\n        verticalBeamOffset={0.0}\n        color=\"#FF79C6\"\n      />\n      \n      <div style={{\n        position: 'absolute',\n        top: '50%',\n        left: '50%',\n        transform: 'translateX(-50%)',\n        width: '86%',\n        height: '60%',\n        backgroundColor: '#060010',\n        borderRadius: '20px',\n        border: '2px solid #FF79C6',\n        display: 'flex',\n        alignItems: 'center',\n        justifyContent: 'center',\n        color: 'white',\n        fontSize: '2rem',\n        zIndex: 6\n      }}>\n        {/* Your content here */}\n      </div>\n\n      <img\n        ref={revealImgRef}\n        src=\"/path/to/image.jpg\"\n        alt=\"Reveal effect\"\n        style={{\n          position: 'absolute',\n          width: '100%',\n          top: '-50%',\n          zIndex: 5,\n          mixBlendMode: 'lighten',\n          opacity: 0.3,\n          pointerEvents: 'none',\n          '--mx': '-9999px',\n          '--my': '-9999px',\n          WebkitMaskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',\n          maskImage: 'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',\n          WebkitMaskRepeat: 'no-repeat',\n          maskRepeat: 'no-repeat'\n        }}\n      />\n    </div>\n  );\n}",
    "dependencies": "npm install three"
  },
  
  
  "Gradual Blur": {
    "description": "Gradual Blur adds a soft blur overlay over the target area, animating from transparent to a blur effect with customizable strength, area, and animation curve.",
    "codesnippet": "import GradualBlur from './GradualBlur';\n\n<section style={{position: 'relative', height: 500, overflow: 'hidden'}}>\n  <div style={{ height: '100%', overflowY: 'auto', padding: '6rem 2rem' }}>\n    {/* Content Here */}\n  </div>\n  <GradualBlur\n    target=\"parent\"\n    position=\"bottom\"\n    height=\"6rem\"\n    strength={2}\n    divCount={5}\n    curve=\"bezier\"\n    exponential={true}\n    opacity={1}\n  />\n</section>",
    "dependencies": "npm install mathjs"
  },
  "Click Spark": {
    "description": "Click Spark generates spark particle effects around clicked elements for a delightful interactive UI feedback.",
    "codesnippet": "import ClickSpark from './ClickSpark';\n\n<ClickSpark\n  sparkColor='#fff'\n  sparkSize={10}\n  sparkRadius={15}\n  sparkCount={8}\n  duration={400}\n>\n  {/* Your content here */}\n</ClickSpark>",
    "dependencies": "npm install"
  },
  "Metallic Paint": {
    "description": "Metallic Paint applies a liquid metal effect to SVG images using customizable edge blur, refraction, pattern scale, and speed for dynamic metallic visuals.",
    "codesnippet": "import MetallicPaint, { parseLogoImage } from \"./MetallicPaint\";\nimport { useState, useEffect } from 'react';\n\nconst Component = () => {\n  const [imageData, setImageData] = useState<ImageData | null>(null);\n\n  useEffect(() => {\n    async function loadDefaultImage() {\n      try {\n        const response = await fetch(logo);\n        const blob = await response.blob();\n        const file = new File([blob], \"default.png\", { type: blob.type });\n        const parsedData = await parseLogoImage(file);\n        setImageData(parsedData?.imageData ?? null);\n      } catch (err) {\n        console.error(\"Error loading default image:\", err);\n      }\n    }\n    loadDefaultImage();\n  }, []);\n\n  return (\n    <div style={{ width: '100%', height: '100vh' }}>\n      <MetallicPaint\n        imageData={imageData ?? new ImageData(1, 1)}\n        params={{ edge: 2, patternBlur: 0.005, patternScale: 2, refraction: 0.015, speed: 0.3, liquid: 0.07 }}\n      />\n    </div>\n  );\n}",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/ClickSpark-TS-CSS"
  },
  "Image Trail": {
    "description": "Image Trail creates a trailing animation of images that follow pointer movements or animate in sequence with GSAP-powered smooth transitions.",
    "codesnippet": "import ImageTrail from './ImageTrail';\n\n<div style={{ height: '500px', position: 'relative', overflow: 'hidden'}}>\n  <ImageTrail\n    key={key}\n    items={[\n      'https://picsum.photos/id/287/300/300',\n      'https://picsum.photos/id/1001/300/300',\n      'https://picsum.photos/id/1025/300/300',\n      'https://picsum.photos/id/1026/300/300',\n      'https://picsum.photos/id/1027/300/300',\n      'https://picsum.photos/id/1028/300/300',\n      'https://picsum.photos/id/1029/300/300',\n      'https://picsum.photos/id/1030/300/300',\n    ]}\n    variant={1}\n  />\n</div>",
    "dependencies": "npm install gsap"
  },

"Splash Cursor": {
    "description": "Splash Cursor creates a liquid splash particle animation around the cursor, with curling ripples and waves for lively mouse interaction effects.",
    "codesnippet": "import SplashCursor from './SplashCursor';\n\n<SplashCursor />",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/SplashCursor-TS-CSS"
  },
  "Meta Balls": {
    "description": "Meta Balls component displays interactive glowing balls that merge and flow smoothly together, reacting to mouse movement with customizable colors and behaviors.",
    "codesnippet": "import MetaBalls from './MetaBalls';\n\n<MetaBalls\n  color=\"#ffffff\"\n  cursorBallColor=\"#ffffff\"\n  cursorBallSize={2}\n  ballCount={15}\n  animationSize={30}\n  enableMouseInteraction={true}\n  enableTransparency={true}\n  hoverSmoothness={0.05}\n  clumpFactor={1}\n  speed={0.3}\n/>",
    "dependencies": "npm install ogl"
  },
  "Star Border": {
    "description": "Star Border adds a stylish animated star-shaped border around elements, such as buttons, with customizable color and animation speed.",
    "codesnippet": "import StarBorder from './StarBorder';\n\n<StarBorder\n  as=\"button\"\n  className=\"custom-class\"\n  color=\"cyan\"\n  speed=\"5s\"\n>\n  // content\n</StarBorder>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/StarBorder-TS-CSS"
  },
  "Animated List": {
    "description": "Animated List displays a list of items with smooth animation effects as items enter and leave, including gradient support, arrow key navigation, and optional scrollbar.",
    "codesnippet": "import AnimatedList from './AnimatedList';\n\nconst items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10'];\n\n<AnimatedList\n  items={items}\n  onItemSelect={(item, index) => console.log(item, index)}\n  showGradients={true}\n  enableArrowNavigation={true}\n  displayScrollbar={true}\n/>",
    "dependencies": "npm install motion"
  },

"Scroll Stack": {
    "description": "Scroll Stack creates a smooth stacked card scroll effect, ideal for showcasing sequential content like cards or steps with elegant scroll behavior.",
    "codesnippet": "import ScrollStack, { ScrollStackItem } from './ScrollStack';\n\n<ScrollStack>\n  <ScrollStackItem>\n    <h2>Card 1</h2>\n    <p>This is the first card in the stack</p>\n  </ScrollStackItem>\n  <ScrollStackItem>\n    <h2>Card 2</h2>\n    <p>This is the second card in the stack</p>\n  </ScrollStackItem>\n  <ScrollStackItem>\n    <h2>Card 3</h2>\n    <p>This is the third card in the stack</p>\n  </ScrollStackItem>\n</ScrollStack>",
    "dependencies": "npm install lenis"
  },
  "Magic Bento": {
    "description": "Magic Bento adds dazzling star effects, spotlight glows, border glows, tilts, magnetism, and click spark animations to text elements for an interactive and vibrant UI.",
    "codesnippet": "import MagicBento from './MagicBento';\n\n<MagicBento \n  textAutoHide={true}\n  enableStars={true}\n  enableSpotlight={true}\n  enableBorderGlow={true}\n  enableTilt={true}\n  enableMagnetism={true}\n  clickEffect={true}\n  spotlightRadius={300}\n  particleCount={12}\n  glowColor=\"132, 0, 255\"\n/>",
    "dependencies": "npm install gsap"
  },
  "Circular Gallery": {
    "description": "Circular Gallery presents items arranged in a circular layout with smooth scrolling and customizable bending, color, and border radius for visually creative galleries.",
    "codesnippet": "import CircularGallery from './CircularGallery';\n\n<div style={{ height: '600px', position: 'relative' }}>\n  <CircularGallery bend={3} textColor=\"#ffffff\" borderRadius={0.05} scrollEase={0.02}/>\n</div>",
    "dependencies": "npm install ogl"
  },
  "Pill Nav": {
    "description": "Pill Nav displays a stylish pill-shaped navigation bar with logo, set of links, customization of animation easing, colors, and responsive behaviors.",
    "codesnippet": "import PillNav from './PillNav';\nimport logo from '/path/to/logo.svg';\n\n<PillNav\n  logo={logo}\n  logoAlt=\"Company Logo\"\n  items={[\n    { label: 'Home', href: '/' },\n    { label: 'About', href: '/about' },\n    { label: 'Services', href: '/services' },\n    { label: 'Contact', href: '/contact' }\n  ]}\n  activeHref=\"/\"\n  className=\"custom-nav\"\n  ease=\"power2.easeOut\"\n  baseColor=\"#000000\"\n  pillColor=\"#ffffff\"\n  hoveredPillTextColor=\"#ffffff\"\n  pillTextColor=\"#000000\"\n/>",
    "dependencies": "npm install gsap"
  },
  "Dome Gallery": {
    "description": "Dome Gallery shows interactive 3D dome-shaped gallery with smooth gestures and immersive presentation, great for photo or item showcases.",
    "codesnippet": "import DomeGallery from './DomeGallery';\n\nexport default function App() {\n  return (\n    <div style={{ width: '100vw', height: '100vh' }}>\n      <DomeGallery />\n    </div>\n  );\n}",
    "dependencies": "npm install @use-gesture/react"
  },
  "Chroma Grid": {
    "description": "Chroma Grid arranges profile or item cards in a colorful grid with animated damping, fade out, and smooth easing effects for lively UI displays.",
    "codesnippet": "import ChromaGrid from './ChromaGrid';\n\nconst items = [\n  {\n    image: \"https://i.pravatar.cc/300?img=1\",\n    title: \"Sarah Johnson\",\n    subtitle: \"Frontend Developer\",\n    handle: \"@sarahjohnson\",\n    borderColor: \"#3B82F6\",\n    gradient: \"linear-gradient(145deg, #3B82F6, #000)\",\n    url: \"https://github.com/sarahjohnson\"\n  },\n  {\n    image: \"https://i.pravatar.cc/300?img=2\",\n    title: \"Mike Chen\",\n    subtitle: \"Backend Engineer\",\n    handle: \"@mikechen\",\n    borderColor: \"#10B981\",\n    gradient: \"linear-gradient(180deg, #10B981, #000)\",\n    url: \"https://linkedin.com/in/mikechen\"\n  }\n];\n\n<div style={{ height: '600px', position: 'relative' }}>\n  <ChromaGrid \n    items={items}\n    radius={300}\n    damping={0.45}\n    fadeOut={0.6}\n    ease=\"power3.out\"\n  />\n</div>",
    "dependencies": "npm install gsap"
  },
  "Model Viewer": {
    "description": "Model Viewer allows displaying interactive 3D models using glTF format with simple React integration, customizable size and controls.",
    "codesnippet": "import ModelViewer from './ModelViewer';\n\n<ModelViewer\n  url=\"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb\"\n  width={400}\n  height={400}\n/>",
    "dependencies": "npm install three @react-three/fiber @react-three/drei"
  },
  "Profile Card": {
    "description": "A modern and interactive profile card component that displays user information such as name, title, handle, avatar, and status. Includes tilt effects, contact button, and user interactivity options.",
    "codesnippet": "import ProfileCard from './ProfileCard';\n  \n<ProfileCard\n  name=\"Javi A. Torres\"\n  title=\"Software Engineer\"\n  handle=\"javicodes\"\n  status=\"Online\"\n  contactText=\"Contact Me\"\n  avatarUrl=\"/path/to/avatar.jpg\"\n  showUserInfo={true}\n  enableTilt={true}\n  enableMobileTilt={false}\n  onContactClick={() => console.log('Contact clicked')}\n/>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/ProfileCard-TS-CSS"
  },
  "Pixel Card": {
    "description": "A pixel-style card component with customizable color variants. Great for retro or stylized UI layouts. Content can be positioned absolutely inside the card.",
    "codesnippet": "import PixelCard from './PixelCard';\n\n<PixelCard variant=\"pink\">\n  // your card content (use position: absolute)\n</PixelCard>",
    "dependencies": "npx shadcn@latest add https://reactbits.dev/r/PixelCard-TS-CSS"
  },
  "Dark Veil": {
    "description": "A mesmerizing dark-themed background effect built with OGL. Ideal for hero sections or immersive landing pages, providing a dynamic, veil-like movement.",
    "codesnippet": "import DarkVeil from './DarkVeil';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <DarkVeil />\n</div>",
    "dependencies": "npm install ogl"
  },
  "Light Rays": {
    "description": "A customizable animated light rays effect rendered with OGL. Includes adjustable ray colors, origin, speed, spread, and optional mouse-follow interaction for dynamic lighting visuals.",
    "codesnippet": "import LightRays from './LightRays';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <LightRays\n    raysOrigin=\"top-center\"\n    raysColor=\"#00ffff\"\n    raysSpeed={1.5}\n    lightSpread={0.8}\n    rayLength={1.2}\n    followMouse={true}\n    mouseInfluence={0.1}\n    noiseAmount={0.1}\n    distortion={0.05}\n    className=\"custom-rays\"\n  />\n</div>",
    "dependencies": "npm install ogl"
  },
  "Color Bends": {
    "description": "A colorful, fluid background animation using Three.js. Allows customization of gradient colors, rotation, warp, noise, and parallax for rich visual depth.",
    "codesnippet": "import ColorBends from './ColorBends';\n  \n<ColorBends\n  colors={[\"#ff5c7a\", \"#8a5cff\", \"#00ffd1\"]}\n  rotation={30}\n  speed={0.3}\n  scale={1.2}\n  frequency={1.4}\n  warpStrength={1.2}\n  mouseInfluence={0.8}\n  parallax={0.6}\n  noise={0.08}\n  transparent\n/>",
    "dependencies": "npm install three"
  },
  "Aurora": {
    "description": "A smooth aurora-like gradient wave animation built using OGL. Great for dynamic hero backgrounds, with customizable color stops, blend intensity, and motion speed.",
    "codesnippet": "import Aurora from './Aurora';\n  \n<Aurora\n  colorStops={[\"#3A29FF\", \"#FF94B4\", \"#FF3232\"]}\n  blend={0.5}\n  amplitude={1.0}\n  speed={0.5}\n/>",
    "dependencies": "npm install ogl"
  },
  "Plasma": {
    "description": "An interactive plasma background effect powered by OGL. Supports color, direction, speed, and mouse interactivity to create vibrant, organic motion.",
    "codesnippet": "import Plasma from './Plasma';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Plasma \n    color=\"#ff6b35\"\n    speed={0.6}\n    direction=\"forward\"\n    scale={1.1}\n    opacity={0.8}\n    mouseInteractive={true}\n  />\n</div>",
    "dependencies": "npm install ogl"
  },

  "Particles": {
    "description": "A lightweight particle background built with OGL. Allows full control over particle count, size, spread, speed, and hover interactions for immersive motion effects.",
    "codesnippet": "import Particles from './Particles';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Particles\n    particleColors={['#ffffff', '#ffffff']}\n    particleCount={200}\n    particleSpread={10}\n    speed={0.1}\n    particleBaseSize={100}\n    moveParticlesOnHover={true}\n    alphaParticles={false}\n    disableRotation={false}\n  />\n</div>",
    "dependencies": "npm install ogl"
  },
  "Galaxy": {
    "description": "A dynamic galaxy animation built using OGL that simulates stars, glow, and subtle color shifts. Includes mouse interaction, density, hue shift, and glow customization.",
    "codesnippet": "import Galaxy from './Galaxy';\n\n// Basic usage\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Galaxy />\n</div>\n\n// With custom prop values\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Galaxy \n    mouseRepulsion={true}\n    mouseInteraction={true}\n    density={1.5}\n    glowIntensity={0.5}\n    saturation={0.8}\n    hueShift={240}\n  />\n</div>",
    "dependencies": "npm install ogl"
  },
  "Threads": {
    "description": "An animated thread-like background made with OGL that creates smooth flowing line visuals. Supports mouse interaction, amplitude control, and wave distance adjustment.",
    "codesnippet": "import Threads from './Threads';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Threads\n    amplitude={1}\n    distance={0}\n    enableMouseInteraction={true}\n  />\n</div>",
    "dependencies": "npm install ogl"
  },
  "Hyperspeed": {
    "description": "A visually stunning hyperspeed tunnel animation using Three.js and postprocessing. Fully customizable with detailed effect options for car lights, lane layout, and motion speed.",
    "codesnippet": "import Hyperspeed from './Hyperspeed';\n\n// the component will fill the height/width of its parent container, edit the CSS to change this\n// the options below are the default values\n\n<Hyperspeed\n  effectOptions={{\n    onSpeedUp: () => { },\n    onSlowDown: () => { },\n    distortion: 'turbulentDistortion',\n    length: 400,\n    roadWidth: 10,\n    islandWidth: 2,\n    lanesPerRoad: 4,\n    fov: 90,\n    fovSpeedUp: 150,\n    speedUp: 2,\n    carLightsFade: 0.4,\n    totalSideLightSticks: 20,\n    lightPairsPerRoadWay: 40,\n    shoulderLinesWidthPercentage: 0.05,\n    brokenLinesWidthPercentage: 0.1,\n    brokenLinesLengthPercentage: 0.5,\n    lightStickWidth: [0.12, 0.5],\n    lightStickHeight: [1.3, 1.7],\n    movingAwaySpeed: [60, 80],\n    movingCloserSpeed: [-120, -160],\n    carLightsLength: [400 * 0.03, 400 * 0.2],\n    carLightsRadius: [0.05, 0.14],\n    carWidthPercentage: [0.3, 0.5],\n    carShiftX: [-0.8, 0.8],\n    carFloorSeparation: [0, 5],\n    colors: {\n      roadColor: 0x080808,\n      islandColor: 0x0a0a0a,\n      background: 0x000000,\n      shoulderLines: 0xFFFFFF,\n      brokenLines: 0xFFFFFF,\n      leftCars: [0xD856BF, 0x6750A2, 0xC247AC],\n      rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],\n      sticks: 0x03B3C3,\n    }\n  }}\n/>",
    "dependencies": "npm install three postprocessing"
  },
  "Grid Distortion": {
    "description": "A grid-based distortion effect built with Three.js. It warps an image using mouse interaction and configurable grid size, strength, and relaxation for fluid, interactive visuals.",
    "codesnippet": "import GridDistortion from './GridDistortion';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <GridDistortion\n    imageSrc=\"https://picsum.photos/1920/1080?grayscale\"\n    grid={10}\n    mouse={0.1}\n    strength={0.15}\n    relaxation={0.9}\n    className=\"custom-class\"\n  />\n</div>",
    "dependencies": "npm install three"
  },
  "Ballpit": {
    "description": "A fun and physics-based 3D ball simulation built using Three.js. Features gravity, friction, and cursor-follow interaction for playful, dynamic background effects.",
    "codesnippet": "//Component inspired by Kevin Levron:\n//https://x.com/soju22/status/1858925191671271801\n  \nimport Ballpit from './Ballpit;'\n\n<div style={{position: 'relative', overflow: 'hidden', minHeight: '500px', maxHeight: '500px', width: '100%'}}>\n  <Ballpit\n    count={200}\n    gravity={0.7}\n    friction={0.8}\n    wallBounce={0.95}\n    followCursor={true}\n  />\n</div>",
    "dependencies": "npm install three"
  },
  "Orb": {
    "description": "A smooth, rotating orb animation using OGL with adjustable hue, hover rotation, and intensity. Great for minimal or futuristic interactive background visuals.",
    "codesnippet": "import Orb from './Orb';\n\n<div style={{ width: '100%', height: '600px', position: 'relative' }}>\n  <Orb\n    hoverIntensity={0.5}\n    rotateOnHover={true}\n    hue={0}\n    forceHoverState={false}\n  />\n</div>",
    "dependencies": "npm install ogl"
  },
  
};
