// Computer Hardware Quiz — question bank
// Each question: category, difficulty (easy|medium|hard), question, answers[], correct (index)

var QUESTIONS = [
  // ===== CPUs =====
  { category: "CPU", difficulty: "easy", question: "What does CPU stand for?", answers: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Underlay"], correct: 0 },
  { category: "CPU", difficulty: "easy", question: "Which company makes Ryzen processors?", answers: ["Intel", "AMD", "NVIDIA", "Qualcomm"], correct: 1 },
  { category: "CPU", difficulty: "easy", question: "What component keeps a CPU cool?", answers: ["Heat sink / cooler", "Sound card", "Power strip", "Network card"], correct: 0 },
  { category: "CPU", difficulty: "medium", question: "What does 'overclocking' a CPU mean?", answers: ["Increasing its clock speed beyond factory settings", "Installing more RAM", "Replacing the thermal paste", "Running it at lower voltage"], correct: 0 },
  { category: "CPU", difficulty: "medium", question: "What is a 'core' in a CPU?", answers: ["An independent processing unit that can execute instructions", "The cache memory of the chip", "A connector on the motherboard", "A type of cooling system"], correct: 0 },
  { category: "CPU", difficulty: "hard", question: "Which Intel socket is compatible with 12th-gen Core desktop CPUs?", answers: ["LGA 1700", "AM4", "LGA 1200", "TRX40"], correct: 0 },
  { category: "CPU", difficulty: "hard", question: "What is SMT (Simultaneous Multi-Threading) used for?", answers: ["Allowing each physical core to run multiple threads at once", "Cooling the processor more efficiently", "Encrypting data in the cache", "Boosting GPU performance"], correct: 0 },
  { category: "CPU", difficulty: "hard", question: "What is the main role of CPU cache (L1/L2/L3)?", answers: ["Store frequently accessed data close to the cores for fast access", "Permanently store the operating system", "Convert AC power to DC power", "Render graphics frames"], correct: 0 },

  // ===== RAM =====
  { category: "RAM", difficulty: "easy", question: "What does RAM stand for?", answers: ["Random Access Memory", "Rapid Action Module", "Read And Memorize", "Runtime Access Manager"], correct: 0 },
  { category: "RAM", difficulty: "easy", question: "What happens to data in RAM when the PC loses power?", answers: ["It is lost because RAM is volatile", "It is saved permanently", "It moves to the hard drive automatically", "Nothing changes"], correct: 0 },
  { category: "RAM", difficulty: "easy", question: "Which of these has MORE capacity?", answers: ["16 GB", "8 GB", "4 GB", "2 GB"], correct: 0 },
  { category: "RAM", difficulty: "medium", question: "What does dual-channel memory do?", answers: ["Increases memory bandwidth by using two sticks in parallel", "Doubles the RAM capacity", "Cools the RAM modules", "Makes RAM non-volatile"], correct: 0 },
  { category: "RAM", difficulty: "medium", question: "Which RAM generation is newer?", answers: ["DDR5", "DDR3", "DDR2", "DDR"], correct: 0 },
  { category: "RAM", difficulty: "hard", question: "What does CAS latency (CL) measure in RAM?", answers: ["The delay between a command and when data is available", "The maximum storage size", "The operating temperature", "The number of channels"], correct: 0 },
  { category: "RAM", difficulty: "hard", question: "Which feature detects and corrects memory errors, common in servers?", answers: ["ECC", "RGB", "XMP", "SLI"], correct: 0 },

  // ===== Storage =====
  { category: "Storage", difficulty: "easy", question: "Which type of drive has NO moving parts?", answers: ["SSD", "HDD", "Floppy disk", "Tape drive"], correct: 0 },
  { category: "Storage", difficulty: "easy", question: "Which usually offers FASTER load times?", answers: ["NVMe SSD", "5400 RPM HDD", "DVD drive", "USB 2.0 flash drive"], correct: 0 },
  { category: "Storage", difficulty: "easy", question: "What unit measures storage capacity?", answers: ["Gigabyte (GB)", "Megahertz (MHz)", "Volt (V)", "Watt (W)"], correct: 0 },
  { category: "Storage", difficulty: "medium", question: "What interface connects an M.2 NVMe SSD to modern motherboards?", answers: ["PCIe", "SATA power only", "IDE", "FireWire"], correct: 0 },
  { category: "Storage", difficulty: "medium", question: "What is the approximate max speed of SATA III?", answers: ["6 Gb/s", "60 Gb/s", "600 Mb/s", "32 Gb/s"], correct: 0 },
  { category: "Storage", difficulty: "hard", question: "What is the main advantage of NVMe over SATA SSDs?", answers: ["It uses PCIe lanes for much higher bandwidth and lower latency", "It stores data magnetically", "It requires no power", "It works without a motherboard"], correct: 0 },
  { category: "Storage", difficulty: "hard", question: "Why should HDDs be defragmented but SSDs generally not?", answers: ["SSDs access all cells equally fast, so fragmentation doesn't slow them and defrag causes extra wear", "Defragmenting erases SSD firmware", "HDDs cannot store fragmented files", "SSDs are always smaller than 1 TB"], correct: 0 },

  // ===== GPUs =====
  { category: "GPU", difficulty: "easy", question: "What does GPU stand for?", answers: ["Graphics Processing Unit", "General Power Unit", "Gaming Processor Utility", "Graphic Port Universal"], correct: 0 },
  { category: "GPU", difficulty: "easy", question: "Which companies make the main dedicated gaming GPUs?", answers: ["NVIDIA and AMD", "Apple and Dell", "Seagate and WD", "Logitech and Razer"], correct: 0 },
  { category: "GPU", difficulty: "easy", question: "Where does a dedicated graphics card get installed?", answers: ["In a PCIe expansion slot on the motherboard", "Inside the power supply", "On top of the CPU", "In a RAM slot"], correct: 0 },
  { category: "GPU", difficulty: "medium", question: "What technology renders multiple frames at once to smooth gameplay?", answers: ["Frame rate (FPS)", "Pixel shader", "Anti-aliasing only", "Thermal throttling"], correct: 0 },
  { category: "GPU", difficulty: "medium", question: "What does NVIDIA's DLSS do?", answers: ["Uses AI to upscale lower-resolution images for better performance", "Overclocks the CPU automatically", "Adds more VRAM to the card", "Compresses game downloads"], correct: 0 },
  { category: "GPU", difficulty: "hard", question: "What does VRAM do in a graphics card?", answers: ["Stores textures, frame buffers and assets for fast GPU access", "Cools the GPU die", "Controls monitor brightness", "Stores BIOS settings"], correct: 0 },
  { category: "GPU", difficulty: "hard", question: "What happens during GPU 'thermal throttling'?", answers: ["The GPU reduces its clocks to lower temperature", "The GPU increases fan noise permanently", "The GPU disables VRAM completely", "The monitor refresh rate doubles"], correct: 0 },

  // ===== Motherboards & Power =====
  { category: "Motherboard & Power", difficulty: "easy", question: "Where do you plug in the CPU on a PC?", answers: ["The motherboard's CPU socket", "The power supply", "A USB port", "The graphics card"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "easy", question: "What does PSU stand for?", answers: ["Power Supply Unit", "Personal System Utility", "Primary Storage Unit", "Processor Speed Unifier"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "easy", question: "What is BIOS/UEFI used for?", answers: ["Firmware that initializes hardware before the OS boots", "Editing photos", "Browsing the web", "Measuring room temperature"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "medium", question: "What does a motherboard chipset do?", answers: ["Manages communication between CPU, memory and peripherals", "Cools the entire case", "Displays images on screen", "Provides Wi-Fi only"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "medium", question: "Which PSU rating indicates high efficiency?", answers: ["80 Plus Gold", "80 Plus Red", "Tier Blue", "Class Z"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "hard", question: "What is the purpose of the CMOS battery on a motherboard?", answers: ["Keeps RTC clock and BIOS settings alive when powered off", "Powers the GPU during gaming", "Charges USB devices", "Boosts CPU overclocks"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "hard", question: "What connector typically powers a modern dedicated GPU?", answers: ["6/8-pin PCIe power connector", "Molex 4-pin only", "SATA cable", "Ethernet port"], correct: 0 },
  { category: "Motherboard & Power", difficulty: "hard", question: "ATX 3.0 PSUs introduced which new native GPU power connector?", answers: ["12VHPWR (16-pin)", "24-pin EPS", "Molex Micro-Fit", "USB-C PD only"], correct: 0 },

  // ===== Peripherals =====
  { category: "Peripherals", difficulty: "easy", question: "Which of these is an INPUT device?", answers: ["Keyboard", "Monitor", "Printer", "Speaker"], correct: 0 },
  { category: "Peripherals", difficulty: "easy", question: "Which cable commonly connects a PC to a modern monitor?", answers: ["HDMI or DisplayPort", "Ethernet", "Phone jack", "Coaxial"], correct: 0 },
  { category: "Peripherals", difficulty: "medium", question: "DisplayPort 1.4 supports roughly what maximum resolution at 60 Hz?", answers: ["8K (7680×4320)", "480p", "720p only", "It cannot carry video"], correct: 0 },
  { category: "Peripherals", difficulty: "medium", question: "What does a USB hub do?", answers: ["Expands one USB port into multiple ports", "Speeds up the internet connection", "Cools down the mouse", "Converts HDMI to audio"], correct: 0 },
  { category: "Peripherals", difficulty: "hard", question: "Which display technology allows individual pixels to turn off for perfect blacks?", answers: ["OLED", "TN LCD with CCFL", "CRT", "Plasma"], correct: 0 },
  { category: "Peripherals", difficulty: "hard", question: "What advantage does a mechanical keyboard switch offer over a basic membrane dome?", answers: ["Distinct tactile feedback and per-key durability ratings", "Silent operation guaranteed", "Built-in speakers", "No need for a USB port"], correct: 0 }
];
