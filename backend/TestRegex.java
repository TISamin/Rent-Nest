public class TestRegex {
    public static void main(String[] args) {
        String clean = "```json\n{\n  \"a\": 1\n}\n```";
        clean = clean.replaceAll("^```[a-zA-Z]*\\s*", "");
        clean = clean.replaceAll("\\s*```$", "");
        System.out.println(clean);
    }
}
