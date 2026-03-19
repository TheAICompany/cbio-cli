#!/usr/bin/env node
import { runCli } from "./commands/runCli.js";

runCli().catch(console.error);
