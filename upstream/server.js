import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/items", async () => {
  return {
    service: "upstream",
    items: ["laptop", "phone", "keyboard"],
  };
});

app.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server is running on ${address}`);
});
