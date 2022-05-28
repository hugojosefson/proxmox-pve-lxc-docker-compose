import { asString, isString } from "./fn.ts";

export async function run(
  command: string | string[],
  stdin?: string,
): Promise<string> {
  const pipeStdIn = isString(stdin);

  const cmd: string[] = isString(command) ? command.split(" ") : command;
  const process = Deno.run({
    cmd,
    stdin: pipeStdIn ? "piped" : "null",
    stdout: "piped",
    stderr: "piped",
  });

  if (pipeStdIn) {
    const stdinBuf = new TextEncoder().encode(stdin);
    try {
      await process.stdin?.write(stdinBuf);
    } finally {
      await process.stdin?.close();
    }
  }

  const [
    status,
    stdout,
    stderr,
  ] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);
  process.close();

  if (status.success) {
    return asString(stdout);
  }
  const reason = {
    ...status,
    stderr: asString(stderr),
  };
  return Promise.reject(reason);
}
