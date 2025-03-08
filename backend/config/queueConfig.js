import amqp from "amqplib";

const { RABBITMQ_URL } = process.env;
if (!RABBITMQ_URL) {
  console.error("❌ ERROR: Missing RABBITMQ_URL in environment variables.");
  process.exit(1);
}

async function testRabbitMQConnection() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    console.log("✅ RabbitMQ Connected Successfully!");
    await connection.close();
  } catch (error) {
    console.error("❌ RabbitMQ Connection Failed:", error);
  }
}

testRabbitMQConnection();
