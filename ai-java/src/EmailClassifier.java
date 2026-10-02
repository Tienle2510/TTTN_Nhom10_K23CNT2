import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;

public class EmailClassifier {

    private static final int PORT = 8080;

    private static final String[] CATEGORIES = {
        "Học tập",
        "Công việc",
        "Quảng cáo",
        "Tài chính",
        "Spam",
        "Thông báo",
        "Khác"
    };


    // =====================================================
    // MAIN
    // =====================================================

    public static void main(String[] args)
            throws Exception {

        HttpServer server =
            HttpServer.create(
                new InetSocketAddress(PORT),
                0
            );


        // =================================================
        // HEALTH
        // =================================================

        server.createContext(
            "/health",
            EmailClassifier::handleHealth
        );


        // =================================================
        // CLASSIFY
        // =================================================

        server.createContext(
            "/classify",
            EmailClassifier::handleAnalyze
        );


        // =================================================
        // ANALYZE
        // =================================================

        server.createContext(
            "/analyze",
            EmailClassifier::handleAnalyze
        );


        // =================================================
        // SUMMARIZE
        // =================================================

        server.createContext(
            "/summarize",
            EmailClassifier::handleSummarize
        );


        server.setExecutor(null);


        System.out.println("");
        System.out.println(
            "================================="
        );
        System.out.println(
            "       JAVA AI EMAIL SERVICE"
        );
        System.out.println(
            "================================="
        );
        System.out.println(
            "AI Server: http://localhost:8080"
        );
        System.out.println(
            "Classify:  http://localhost:8080/classify"
        );
        System.out.println(
            "Analyze:   http://localhost:8080/analyze"
        );
        System.out.println(
            "Summarize: http://localhost:8080/summarize"
        );
        System.out.println(
            "Health:    http://localhost:8080/health"
        );
        System.out.println(
            "================================="
        );
        System.out.println(
            "Java AI đang chạy..."
        );
        System.out.println("");


        server.start();
    }


    // =====================================================
    // HEALTH
    // =====================================================

    private static void handleHealth(
        HttpExchange exchange
    ) throws IOException {

        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("GET")) {

            sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed\"}"
            );

            return;
        }


        String response =
            "{"
            + "\"success\":true,"
            + "\"service\":\"Java AI\","
            + "\"status\":\"online\","
            + "\"message\":\"Java AI đang hoạt động\""
            + "}";


        sendJson(
            exchange,
            200,
            response
        );
    }


    // =====================================================
    // ANALYZE / CLASSIFY
    // =====================================================

    private static void handleAnalyze(
        HttpExchange exchange
    ) throws IOException {

        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed\"}"
            );

            return;
        }


        String body =
            readBody(exchange);


        String sender =
            extractJsonString(
                body,
                "sender"
            );


        String subject =
            extractJsonString(
                body,
                "subject"
            );


        String content =
            extractJsonString(
                body,
                "content"
            );


        AnalysisResult result =
            analyze(
                sender,
                subject,
                content
            );


        String response =
            "{"
            + "\"success\":true,"
            + "\"category\":\""
            + escapeJson(result.category)
            + "\","
            + "\"confidence\":"
            + result.confidence
            + ","
            + "\"priority\":\""
            + escapeJson(result.priority)
            + "\","
            + "\"phishingRisk\":\""
            + escapeJson(result.phishingRisk)
            + "\","
            + "\"summary\":\""
            + escapeJson(result.summary)
            + "\","
            + "\"reasons\":"
            + jsonArray(result.reasons)
            + ","
            + "\"scores\":"
            + jsonScores(result.scores)
            + "}";


        sendJson(
            exchange,
            200,
            response
        );
    }


    // =====================================================
    // SUMMARIZE
    // =====================================================

    private static void handleSummarize(
        HttpExchange exchange
    ) throws IOException {

        if (!exchange.getRequestMethod()
                .equalsIgnoreCase("POST")) {

            sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed\"}"
            );

            return;
        }


        String body =
            readBody(exchange);


        String sender =
            extractJsonString(
                body,
                "sender"
            );


        String subject =
            extractJsonString(
                body,
                "subject"
            );


        String content =
            extractJsonString(
                body,
                "content"
            );


        // =============================================
        // GỌI EMAIL SUMMARIZER
        // =============================================

        Map<String, Object> result =
            EmailSummarizer.summarize(
                sender,
                subject,
                content
            );


        // =============================================
        // LẤY SUMMARY
        // =============================================

        String summary =
            String.valueOf(
                result.getOrDefault(
                    "summary",
                    ""
                )
            );


        // =============================================
        // LẤY KEY POINTS
        // =============================================

        @SuppressWarnings("unchecked")
        List<String> keyPoints =
            (List<String>)
                result.getOrDefault(
                    "keyPoints",
                    new ArrayList<String>()
                );


        // =============================================
        // LẤY KEYWORDS
        // =============================================

        @SuppressWarnings("unchecked")
        List<String> keywords =
            (List<String>)
                result.getOrDefault(
                    "keywords",
                    new ArrayList<String>()
                );


        // =============================================
        // TẠO JSON RESPONSE
        // =============================================

        String response =
            "{"
            + "\"success\":true,"
            + "\"summary\":\""
            + escapeJson(summary)
            + "\","
            + "\"keyPoints\":"
            + jsonArray(keyPoints)
            + ","
            + "\"keywords\":"
            + jsonArray(keywords)
            + "}";


        sendJson(
            exchange,
            200,
            response
        );
    }


    // =====================================================
    // AI CLASSIFICATION
    // =====================================================

    private static AnalysisResult analyze(
        String sender,
        String subject,
        String content
    ) {

        String full =
            safe(sender)
            + " "
            + safe(subject)
            + " "
            + safe(content);


        String searchText =
            normalize(full);


        String subjectText =
            normalize(subject);


        String senderText =
            normalize(sender);


        Map<String, Integer> scores =
            new LinkedHashMap<>();


        for (String category : CATEGORIES) {

            scores.put(
                category,
                0
            );
        }


        // =================================================
        // TÀI CHÍNH
        // =================================================

        addKeywords(
            scores,
            "Tài chính",
            searchText,
            2,
            new String[]{
                "mbbank",
                "vietcombank",
                "techcombank",
                "bidv",
                "acb",
                "tpbank",
                "agribank",
                "momo",
                "zalopay",
                "ngan hang",
                "banking",
                "giao dich",
                "chuyen khoan",
                "tai khoan",
                "so du",
                "thanh toan",
                "hoa don",
                "the ngan hang",
                "the tin dung",
                "tin dung",
                "khoan vay",
                "transaction",
                "payment",
                "invoice",
                "money",
                "balance"
            }
        );


        // =================================================
        // HỌC TẬP
        // =================================================

        addKeywords(
            scores,
            "Học tập",
            searchText,
            2,
            new String[]{
                "truong",
                "sinh vien",
                "hoc phi",
                "lich thi",
                "bai tap",
                "mon hoc",
                "hoc ky",
                "giang vien",
                "giao vien",
                "lop hoc",
                "diem",
                "exam",
                "assignment",
                "university",
                "school",
                "student",
                "course",
                "classroom",
                "semester"
            }
        );


        // =================================================
        // CÔNG VIỆC
        // =================================================

        addKeywords(
            scores,
            "Công việc",
            searchText,
            2,
            new String[]{
                "cong viec",
                "tuyen dung",
                "phong van",
                "hop dong",
                "du an",
                "cuoc hop",
                "meeting",
                "deadline",
                "nhan su",
                "luong",
                "cv",
                "resume",
                "job",
                "interview",
                "task",
                "project",
                "jira",
                "work"
            }
        );


        // =================================================
        // QUẢNG CÁO
        // =================================================

        addKeywords(
            scores,
            "Quảng cáo",
            searchText,
            2,
            new String[]{
                "khuyen mai",
                "giam gia",
                "uu dai",
                "voucher",
                "coupon",
                "sale",
                "promotion",
                "offer",
                "mua ngay",
                "quang cao",
                "newsletter",
                "deal",
                "freeship",
                "discount"
            }
        );


        // =================================================
        // SPAM
        // =================================================

        addKeywords(
            scores,
            "Spam",
            searchText,
            3,
            new String[]{
                "trung thuong",
                "trung giai",
                "xoso",
                "casino",
                "kiem tien nhanh",
                "tien mien phi",
                "free money",
                "winner",
                "jackpot",
                "click ngay",
                "nhan thuong",
                "qua tang dac biet"
            }
        );


        // =================================================
        // THÔNG BÁO
        // =================================================

        addKeywords(
            scores,
            "Thông báo",
            searchText,
            2,
            new String[]{
                "thong bao",
                "canh bao",
                "xac nhan",
                "dang nhap",
                "verification",
                "verify",
                "alert",
                "notification",
                "cap nhat",
                "he thong",
                "security",
                "account activity",
                "system"
            }
        );


        // =================================================
        // SUBJECT BOOST
        // =================================================

        addSubjectBoost(
            scores,
            subjectText
        );


        // =================================================
        // SENDER BOOST
        // =================================================

        addSenderBoost(
            scores,
            senderText
        );


        String category =
            getBestCategory(scores);


        int topScore =
            scores.get(category);


        double confidence =
            calculateConfidence(
                topScore,
                scores
            );


        String priority =
            calculatePriority(
                searchText
            );


        String phishingRisk =
            calculatePhishingRisk(
                searchText,
                senderText
            );


        List<String> reasons =
            getReasons(
                category,
                searchText
            );


        String summary =
            buildSummary(
                category,
                confidence
            );


        return new AnalysisResult(
            category,
            confidence,
            priority,
            phishingRisk,
            summary,
            reasons,
            scores
        );
    }


    // =====================================================
    // ADD KEYWORDS
    // =====================================================

    private static void addKeywords(
        Map<String, Integer> scores,
        String category,
        String text,
        int weight,
        String[] keywords
    ) {

        for (String keyword : keywords) {

            if (
                text.contains(
                    normalize(keyword)
                )
            ) {

                scores.put(
                    category,
                    scores.get(category)
                    + weight
                );
            }
        }
    }


    // =====================================================
    // SUBJECT BOOST
    // =====================================================

    private static void addSubjectBoost(
        Map<String, Integer> scores,
        String subject
    ) {

        if (subject.isEmpty()) {
            return;
        }


        addKeywords(
            scores,
            "Tài chính",
            subject,
            3,
            new String[]{
                "giao dich",
                "thanh toan",
                "tai khoan",
                "ngan hang",
                "mbbank",
                "hoa don"
            }
        );


        addKeywords(
            scores,
            "Học tập",
            subject,
            3,
            new String[]{
                "lich thi",
                "hoc phi",
                "sinh vien",
                "bai tap",
                "truong",
                "exam"
            }
        );


        addKeywords(
            scores,
            "Công việc",
            subject,
            3,
            new String[]{
                "phong van",
                "tuyen dung",
                "meeting",
                "deadline",
                "project"
            }
        );


        addKeywords(
            scores,
            "Quảng cáo",
            subject,
            3,
            new String[]{
                "khuyen mai",
                "giam gia",
                "voucher",
                "sale",
                "promotion"
            }
        );
    }


    // =====================================================
    // SENDER BOOST
    // =====================================================

    private static void addSenderBoost(
        Map<String, Integer> scores,
        String sender
    ) {

        if (
            sender.contains("mbbank")
            || sender.contains("vietcombank")
            || sender.contains("techcombank")
            || sender.contains("bidv")
            || sender.contains("acb")
        ) {

            scores.put(
                "Tài chính",
                scores.get("Tài chính") + 5
            );
        }


        if (
            sender.contains("school")
            || sender.contains("edu.vn")
            || sender.contains(".edu")
            || sender.contains("university")
        ) {

            scores.put(
                "Học tập",
                scores.get("Học tập") + 5
            );
        }


        if (
            sender.contains("shop")
            || sender.contains("sale")
            || sender.contains("promo")
            || sender.contains("marketing")
        ) {

            scores.put(
                "Quảng cáo",
                scores.get("Quảng cáo") + 4
            );
        }
    }


    // =====================================================
    // BEST CATEGORY
    // =====================================================

    private static String getBestCategory(
        Map<String, Integer> scores
    ) {

        String best =
            "Khác";


        int max = 0;


        for (
            Map.Entry<String, Integer> entry
            : scores.entrySet()
        ) {

            if (
                entry.getValue() > max
            ) {

                max =
                    entry.getValue();

                best =
                    entry.getKey();
            }
        }


        return best;
    }


    // =====================================================
    // CONFIDENCE
    // =====================================================

    private static double calculateConfidence(
        int topScore,
        Map<String, Integer> scores
    ) {

        if (topScore <= 0) {
            return 0.50;
        }


        List<Integer> values =
            new ArrayList<>(
                scores.values()
            );


        values.sort(
            Collections.reverseOrder()
        );


        int second =
            values.size() > 1
                ? values.get(1)
                : 0;


        double confidence;


        if (topScore >= 8) {

            confidence = 0.95;

        } else if (topScore >= 5) {

            confidence = 0.90;

        } else if (topScore >= 3) {

            confidence = 0.85;

        } else if (topScore >= 2) {

            confidence = 0.80;

        } else {

            confidence = 0.70;
        }


        if (
            topScore - second <= 1
            && topScore < 5
        ) {

            confidence -= 0.10;
        }


        if (confidence < 0.50) {
            confidence = 0.50;
        }


        return confidence;
    }


    // =====================================================
    // PRIORITY
    // =====================================================

    private static String calculatePriority(
        String text
    ) {

        if (
            containsAny(
                text,
                new String[]{
                    "khan cap",
                    "urgent",
                    "critical",
                    "canh bao",
                    "security alert",
                    "giao dich that bai",
                    "tai khoan bi khoa"
                }
            )
        ) {

            return "high";
        }


        if (
            containsAny(
                text,
                new String[]{
                    "thong bao",
                    "xac nhan",
                    "deadline",
                    "thanh toan",
                    "lich thi"
                }
            )
        ) {

            return "medium";
        }


        return "low";
    }


    // =====================================================
    // PHISHING RISK
    // =====================================================

    private static String calculatePhishingRisk(
        String text,
        String sender
    ) {

        int risk = 0;


        if (
            containsAny(
                text,
                new String[]{
                    "click vao link",
                    "click ngay",
                    "xac minh tai khoan",
                    "verify account",
                    "nhap mat khau",
                    "password",
                    "urgent",
                    "khan cap"
                }
            )
        ) {

            risk++;
        }


        if (
            text.contains("http://")
            || text.contains("bit.ly")
            || text.contains("tinyurl")
        ) {

            risk++;
        }


        if (
            sender.contains("mbbank")
            || sender.contains("vietcombank")
            || sender.contains("techcombank")
            || sender.contains("bidv")
        ) {

            risk--;
        }


        if (risk >= 3) {

            return "danger";
        }


        if (risk >= 1) {

            return "suspicious";
        }


        return "safe";
    }


    // =====================================================
    // REASONS
    // =====================================================

    private static List<String> getReasons(
        String category,
        String text
    ) {

        List<String> reasons =
            new ArrayList<>();


        Map<String, String[]> keywords =
            new HashMap<>();


        keywords.put(
            "Tài chính",
            new String[]{
                "giao dich",
                "ngan hang",
                "thanh toan",
                "tai khoan",
                "hoa don"
            }
        );


        keywords.put(
            "Học tập",
            new String[]{
                "sinh vien",
                "hoc phi",
                "lich thi",
                "bai tap",
                "truong"
            }
        );


        keywords.put(
            "Công việc",
            new String[]{
                "tuyen dung",
                "phong van",
                "du an",
                "meeting",
                "deadline"
            }
        );


        keywords.put(
            "Quảng cáo",
            new String[]{
                "khuyen mai",
                "giam gia",
                "voucher",
                "sale",
                "promotion"
            }
        );


        keywords.put(
            "Spam",
            new String[]{
                "trung thuong",
                "casino",
                "kiem tien nhanh",
                "nhan thuong"
            }
        );


        keywords.put(
            "Thông báo",
            new String[]{
                "thong bao",
                "canh bao",
                "xac nhan",
                "cap nhat"
            }
        );


        String[] categoryKeywords =
            keywords.get(category);


        if (categoryKeywords != null) {

            for (
                String keyword
                : categoryKeywords
            ) {

                if (
                    text.contains(
                        normalize(keyword)
                    )
                ) {

                    reasons.add(
                        "Phát hiện từ khóa: "
                        + keyword
                    );
                }


                if (reasons.size() >= 3) {
                    break;
                }
            }
        }


        if (reasons.isEmpty()) {

            reasons.add(
                "Nội dung chưa có dấu hiệu rõ ràng"
            );
        }


        return reasons;
    }


    // =====================================================
    // SUMMARY PHÂN LOẠI
    // =====================================================

    private static String buildSummary(
        String category,
        double confidence
    ) {

        int percent =
            (int) Math.round(
                confidence * 100
            );


        return
            "Email được AI phân loại vào nhóm "
            + category
            + " với độ tin cậy "
            + percent
            + "%.";
    }


    // =====================================================
    // CONTAINS ANY
    // =====================================================

    private static boolean containsAny(
        String text,
        String[] values
    ) {

        for (String value : values) {

            if (
                text.contains(
                    normalize(value)
                )
            ) {

                return true;
            }
        }


        return false;
    }


    // =====================================================
    // NORMALIZE
    // =====================================================

    private static String normalize(
        String text
    ) {

        if (text == null) {
            return "";
        }


        String value =
            Normalizer.normalize(
                text.toLowerCase(
                    Locale.ROOT
                ),
                Normalizer.Form.NFD
            );


        value =
            value.replaceAll(
                "\\p{M}",
                ""
            );


        return value;
    }


    // =====================================================
    // SAFE
    // =====================================================

    private static String safe(
        String text
    ) {

        return text == null
            ? ""
            : text;
    }


    // =====================================================
    // READ BODY
    // =====================================================

    private static String readBody(
        HttpExchange exchange
    ) throws IOException {

        InputStream input =
            exchange.getRequestBody();


        ByteArrayOutputStream output =
            new ByteArrayOutputStream();


        byte[] buffer =
            new byte[4096];


        int length;


        while (
            (length =
                input.read(buffer))
            != -1
        ) {

            output.write(
                buffer,
                0,
                length
            );
        }


        return output.toString(
            StandardCharsets.UTF_8
        );
    }


    // =====================================================
    // EXTRACT JSON STRING
    // =====================================================

    private static String extractJsonString(
        String json,
        String key
    ) {

        if (json == null) {
            return "";
        }


        String search =
            "\"" + key + "\"";


        int keyIndex =
            json.indexOf(search);


        if (keyIndex == -1) {
            return "";
        }


        int colon =
            json.indexOf(
                ":",
                keyIndex
            );


        if (colon == -1) {
            return "";
        }


        int start =
            json.indexOf(
                "\"",
                colon
            );


        if (start == -1) {
            return "";
        }


        StringBuilder result =
            new StringBuilder();


        boolean escaped = false;


        for (
            int i = start + 1;
            i < json.length();
            i++
        ) {

            char c =
                json.charAt(i);


            if (escaped) {

                switch (c) {

                    case '"':
                        result.append('"');
                        break;

                    case '\\':
                        result.append('\\');
                        break;

                    case 'n':
                        result.append('\n');
                        break;

                    case 'r':
                        result.append('\r');
                        break;

                    case 't':
                        result.append('\t');
                        break;

                    default:
                        result.append(c);
                }


                escaped = false;

            } else if (c == '\\') {

                escaped = true;

            } else if (c == '"') {

                break;

            } else {

                result.append(c);
            }
        }


        return result.toString();
    }


    // =====================================================
    // ESCAPE JSON
    // =====================================================

    private static String escapeJson(
        String value
    ) {

        if (value == null) {
            return "";
        }


        return value
            .replace(
                "\\",
                "\\\\"
            )
            .replace(
                "\"",
                "\\\""
            )
            .replace(
                "\n",
                "\\n"
            )
            .replace(
                "\r",
                "\\r"
            );
    }


    // =====================================================
    // JSON ARRAY
    // =====================================================

    private static String jsonArray(
        List<String> values
    ) {

        StringBuilder result =
            new StringBuilder("[");


        for (
            int i = 0;
            i < values.size();
            i++
        ) {

            if (i > 0) {
                result.append(",");
            }


            result.append("\"")
                .append(
                    escapeJson(
                        values.get(i)
                    )
                )
                .append("\"");
        }


        result.append("]");


        return result.toString();
    }


    // =====================================================
    // JSON SCORES
    // =====================================================

    private static String jsonScores(
        Map<String, Integer> scores
    ) {

        StringBuilder result =
            new StringBuilder("{");


        boolean first = true;


        for (
            Map.Entry<String, Integer> entry
            : scores.entrySet()
        ) {

            if (!first) {
                result.append(",");
            }


            first = false;


            result.append("\"")
                .append(
                    escapeJson(
                        entry.getKey()
                    )
                )
                .append("\":")
                .append(
                    entry.getValue()
                );
        }


        result.append("}");


        return result.toString();
    }


    // =====================================================
    // SEND JSON
    // =====================================================

    private static void sendJson(
        HttpExchange exchange,
        int status,
        String response
    ) throws IOException {

        byte[] data =
            response.getBytes(
                StandardCharsets.UTF_8
            );


        exchange.getResponseHeaders()
            .set(
                "Content-Type",
                "application/json; charset=UTF-8"
            );


        exchange.sendResponseHeaders(
            status,
            data.length
        );


        OutputStream output =
            exchange.getResponseBody();


        output.write(data);

        output.close();
    }


    // =====================================================
    // ANALYSIS RESULT
    // =====================================================

    private static class AnalysisResult {

        String category;

        double confidence;

        String priority;

        String phishingRisk;

        String summary;

        List<String> reasons;

        Map<String, Integer> scores;


        AnalysisResult(
            String category,
            double confidence,
            String priority,
            String phishingRisk,
            String summary,
            List<String> reasons,
            Map<String, Integer> scores
        ) {

            this.category =
                category;

            this.confidence =
                confidence;

            this.priority =
                priority;

            this.phishingRisk =
                phishingRisk;

            this.summary =
                summary;

            this.reasons =
                reasons;

            this.scores =
                scores;
        }
    }
}