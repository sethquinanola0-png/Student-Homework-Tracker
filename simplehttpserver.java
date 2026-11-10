import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.file.Files;

public class SimpleHttpServer {
    public static void main(String[] args) throws IOException {
        int port = 8080;
        
        // 0.0.0.0 lets any PC, CP, or Tablet on your Wi-Fi connect
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        server.createContext("/", new FileHandler());
        server.start();

        String ip = InetAddress.getLocalHost().getHostAddress();
        System.out.println("🚀 Server running!");
        System.out.println("PC address: http://localhost:" + port + "/index.html");
        System.out.println("CP & Tab address: http://" + ip + ":" + port + "/index.html");
    }

    static class FileHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";

            File file = new File("." + path);
            if (!file.exists()) {
                String error = "404 Not Found";
                exchange.sendResponseHeaders(404, error.length());
                exchange.getResponseBody().write(error.getBytes());
                exchange.close();
                return;
            }

            String mime = "text/plain";
            if (path.endsWith(".html")) mime = "text/html; charset=UTF-8";
            else if (path.endsWith(".css")) mime = "text/css; charset=UTF-8";
            else if (path.endsWith(".js")) mime = "application/javascript; charset=UTF-8";

            exchange.getResponseHeaders().set("Content-Type", mime);
            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        }
    }
}