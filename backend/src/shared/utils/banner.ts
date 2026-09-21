export function printServerBanner(port: number, envName: string): void {
  const cyan = '\x1b[38;2;6;182;212m';
  const indigo = '\x1b[38;2;99;102;241m';
  const violet = '\x1b[38;2;168;85;247m';
  const pink = '\x1b[38;2;244;63;94m';
  const green = '\x1b[38;2;34;197;94m';
  const yellow = '\x1b[38;2;234;179;8m';
  const white = '\x1b[38;2;255;255;255m';
  const muted = '\x1b[38;2;148;163;184m';
  const bold = '\x1b[1m';
  const reset = '\x1b[0m';

  const logo = [
    `  ${bold}${cyan}███${reset}   ${bold}${indigo}████${reset}    ${bold}${violet}███${reset}    ${bold}${pink}████${reset}`,
    `  ${bold}${cyan} █ ${reset}   ${bold}${indigo}█   █${reset}    ${bold}${violet}█ ${reset}   ${bold}${pink}█    ${reset}`,
    `  ${bold}${cyan} █ ${reset}   ${bold}${indigo}████ ${reset}    ${bold}${violet}█ ${reset}    ${bold}${pink}███ ${reset}`,
    `  ${bold}${cyan} █ ${reset}   ${bold}${indigo}█  █ ${reset}    ${bold}${violet}█ ${reset}       ${bold}${pink}█${reset}`,
    `  ${bold}${cyan}███${reset}   ${bold}${indigo}█   █${reset}   ${bold}${violet}███${reset}   ${bold}${pink}████ ${reset}`,
  ].join('\n');

  console.log('\n' + logo);
  console.log(`\n  ${bold}${white}INTELLIGENT REALTIME INTERACTIVE SYSTEM${reset}`);
  console.log(`  ${muted}---------------------------------------------------------${reset}`);
  console.log(`  ${green}●${reset} ${bold}${white}STATUS${reset}     : ${green}${bold}Active & Listening${reset}`);
  console.log(`  ${cyan}●${reset} ${bold}${white}SERVER${reset}     : ${cyan}${bold}http://localhost:${port}/api/v1${reset}`);
  console.log(`  ${yellow}●${reset} ${bold}${white}ENV${reset}        : ${yellow}${bold}${envName}${reset}`);
  console.log(`  ${green}●${reset} ${bold}${white}DATABASE${reset}   : ${green}MongoDB Atlas${reset} ${muted}|${reset} ${violet}Qdrant Cloud${reset}`);
  console.log(`  ${pink}●${reset} ${bold}${white}AI & VOICE${reset} : ${pink}LiveKit${reset} ${muted}•${reset} ${yellow}Groq${reset} ${muted}•${reset} ${cyan}Gemini${reset} ${muted}•${reset} ${green}Sarvam${reset}`);
  console.log(`  ${muted}---------------------------------------------------------${reset}\n`);
}
