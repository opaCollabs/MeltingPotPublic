import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.Scanner;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;

public class ImageToBase64Sender {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter path to the image file: ");
        String imagePath = scanner.nextLine();

        try {
            File imageFile = new File(imagePath);
            FileInputStream fileInputStreamReader = new FileInputStream(imageFile);
            byte[] imageData = new byte[(int) imageFile.length()];
            fileInputStreamReader.read(imageData);

            String base64Image = Base64.getEncoder().encodeToString(imageData);

            String responseJson = sendBase64StringToAPI(imageFile.getName(), base64Image);

            System.out.println("Response from API:");
            System.out.println(responseJson);

            fileInputStreamReader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String sendBase64StringToAPI(String originalName, String base64Image) {
        try {
            URL url = new URL("http://localhost:3000/api/upload");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);

            String jsonInputString = "{\"image\":{\"originalname\":\"" + originalName + "\",\"data\":\"" + base64Image + "\"}}";

            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }

            InputStream inputStream = connection.getInputStream();
            Scanner scanner = new Scanner(inputStream).useDelimiter("\\A");
            String responseJson = scanner.hasNext() ? scanner.next() : "";

            int responseCode = connection.getResponseCode();
            System.out.println("Response Code: " + responseCode);

            connection.disconnect();

            return responseJson;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}
