package com.chm;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.YearMonth;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class ChmApplicationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final AtomicInteger COUNTER = new AtomicInteger(1);

    @Test
    void register_validData_returns201() throws Exception {
        ObjectNode payload = signupPayload(uniqueUsername(), "Password@123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.refreshToken").exists())
            .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void register_duplicateUsername_returns409() throws Exception {
        String username = uniqueUsername();
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupPayload(username, "Password@123").toString()))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupPayload(username, "Password@123").toString()))
            .andExpect(status().isConflict());
    }

    @Test
    void register_blankUsername_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupPayload("", "Password@123").toString()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.fieldErrors.username").exists());
    }

    @Test
    void register_blankPassword_returns422() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupPayload(uniqueUsername(), "").toString()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void login_validCredentials_returnsJwtAndRefreshToken() throws Exception {
        String username = uniqueUsername();
        register(username, "Password@123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(username, "Password@123").toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.refreshToken").exists())
            .andExpect(jsonPath("$.roles", hasSize(1)));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String username = uniqueUsername();
        register(username, "Password@123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(username, "Wrong@123").toString()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void login_unknownUser_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(uniqueUsername(), "Password@123").toString()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_validRefreshToken_returnsNewAccessToken() throws Exception {
        String username = uniqueUsername();
        register(username, "Password@123");
        JsonNode login = login(username, "Password@123");

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("refreshToken", login.get("refreshToken").asText());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.refreshToken").exists());
    }

    @Test
    void getArticles_unauthenticated_returns200() throws Exception {
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Public Cat");
        createArticle(adminToken, articlePayload("Public Article", categoryId, "PUBLISHED", "news,public"));

        mockMvc.perform(get("/api/articles"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void getArticles_filterByCategory_returnsFiltered() throws Exception {
        String adminToken = adminToken();
        long firstCategoryId = createCategory(adminToken, "Category One");
        long secondCategoryId = createCategory(adminToken, "Category Two");
        createArticle(adminToken, articlePayload("Category One Article", firstCategoryId, "PUBLISHED", "alpha"));
        createArticle(adminToken, articlePayload("Category Two Article", secondCategoryId, "PUBLISHED", "beta"));

        mockMvc.perform(get("/api/articles").param("categoryId", String.valueOf(firstCategoryId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].categoryId").value(firstCategoryId));
    }

    @Test
    void getArticles_filterByMonth_returnsFiltered() throws Exception {
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Monthly Category");
        createArticle(adminToken, articlePayload("Monthly Article", categoryId, "PUBLISHED", "month"));

        mockMvc.perform(get("/api/articles").param("month", YearMonth.now().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].title").exists());
    }

    @Test
    void getArticle_publishedId_unauthenticated_returns200() throws Exception {
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Published Category");
        long articleId = createArticle(adminToken, articlePayload("Published Article", categoryId, "PUBLISHED", "pub"));

        mockMvc.perform(get("/api/articles/{id}", articleId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(articleId));
    }

    @Test
    void getArticle_draftId_asOwner_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Draft Category");
        long articleId = createArticle(userToken, articlePayload("Owner Draft Article", categoryId, "DRAFT", "owner"));

        mockMvc.perform(get("/api/articles/{id}", articleId).header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void getArticle_draftId_asOtherUser_returns403() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String otherToken = registeredUserToken(uniqueUsername());
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Other User Category");
        long articleId = createArticle(ownerToken, articlePayload("Draft for Owner", categoryId, "DRAFT", "private"));

        mockMvc.perform(get("/api/articles/{id}", articleId).header(HttpHeaders.AUTHORIZATION, bearer(otherToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void getArticles_filterByDraft_asUser_returnsOnlyOwnDrafts() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String otherToken = registeredUserToken(uniqueUsername());
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Draft Filter Category");
        ObjectNode ownDraftPayload = articlePayload("Own Draft Article", categoryId, "DRAFT", "own-draft");
        ObjectNode otherDraftPayload = articlePayload("Other Draft Article", categoryId, "DRAFT", "other-draft");
        createArticle(ownerToken, ownDraftPayload);
        createArticle(otherToken, otherDraftPayload);

        mockMvc.perform(get("/api/articles")
                .param("status", "DRAFT")
                .header(HttpHeaders.AUTHORIZATION, bearer(ownerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[*].title", hasItem(ownDraftPayload.get("title").asText())))
            .andExpect(jsonPath("$.items[*].title", not(hasItem(otherDraftPayload.get("title").asText()))))
            .andExpect(jsonPath("$.items[*].title", everyItem(containsString("Own Draft Article"))));
    }

    @Test
    void createArticle_asUser_savedAsDraft() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "User Draft Category");

        mockMvc.perform(post("/api/articles")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(articlePayload("User Draft", categoryId, "DRAFT", "user").toString()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createArticle_asUser_sendsPublished_statusForcedToDraft() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Forced Draft Category");

        mockMvc.perform(post("/api/articles")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(articlePayload("Forced Draft Article", categoryId, "PUBLISHED", "forced").toString()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createArticle_unauthenticated_returns401() throws Exception {
        long categoryId = createCategory(adminToken(), "No Auth Category");

        mockMvc.perform(post("/api/articles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(articlePayload("No Auth Article", categoryId, "DRAFT", "anon").toString()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void createArticle_missingTitle_returns422() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Validation Category One");
        ObjectNode payload = articlePayload("Valid Title", categoryId, "DRAFT", "validation");
        payload.put("title", "");

        mockMvc.perform(post("/api/articles")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    @Test
    void createArticle_bodyTooShort_returns422() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Validation Category Two");
        ObjectNode payload = articlePayload("Short Body Article", categoryId, "DRAFT", "short");
        payload.put("body", "too short");

        mockMvc.perform(post("/api/articles")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.fieldErrors.body").exists());
    }

    @Test
    void updateArticle_asOwner_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Owner Update Category");
        long articleId = createArticle(userToken, articlePayload("Owner Update Article", categoryId, "DRAFT", "owner-update"));
        ObjectNode payload = articlePayload("Updated By Owner", categoryId, "DRAFT", "updated");

        mockMvc.perform(put("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(payload.get("title").asText()));
    }

    @Test
    void updateArticle_asNonOwnerUser_returns403() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String otherToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Non Owner Category");
        long articleId = createArticle(ownerToken, articlePayload("Owner Article", categoryId, "DRAFT", "owner"));

        mockMvc.perform(put("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(articlePayload("Illegal Update", categoryId, "DRAFT", "forbidden").toString()))
            .andExpect(status().isForbidden());
    }

    @Test
    void updateArticle_asManager_returns200() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        JsonNode manager = register(uniqueUsername(), "Password@123");
        assignRole(adminToken(), manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long categoryId = createCategory(adminToken(), "Manager Update Category");
        long articleId = createArticle(ownerToken, articlePayload("Manager Editable Article", categoryId, "DRAFT", "manager"));
        ObjectNode payload = articlePayload("Updated By Manager", categoryId, "PUBLISHED", "manager-edited");

        mockMvc.perform(put("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(payload.get("title").asText()));
    }

    @Test
    void updateArticle_asAdmin_returns200() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Admin Update Category");
        long articleId = createArticle(ownerToken, articlePayload("Admin Editable Article", categoryId, "DRAFT", "admin"));
        ObjectNode payload = articlePayload("Updated By Admin", categoryId, "PUBLISHED", "admin-edited");

        mockMvc.perform(put("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value(payload.get("title").asText()));
    }

    @Test
        void publishArticle_asOwnerUser_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Publish Restriction Category");
        long articleId = createArticle(userToken, articlePayload("User Publish Attempt", categoryId, "DRAFT", "publish"));

        mockMvc.perform(patch("/api/articles/{id}/publish", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"));
        }

        @Test
        void publishArticle_asOtherUser_returns403() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String otherToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Publish Ownership Category");
        long articleId = createArticle(ownerToken, articlePayload("Other User Publish Attempt", categoryId, "DRAFT", "publish-other"));

        mockMvc.perform(patch("/api/articles/{id}/publish", articleId)
            .header(HttpHeaders.AUTHORIZATION, bearer(otherToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void publishArticle_asManager_returns200() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long categoryId = createCategory(adminToken, "Publishable Category");
        long articleId = createArticle(ownerToken, articlePayload("Manager Publishable", categoryId, "DRAFT", "publishable"));

        mockMvc.perform(patch("/api/articles/{id}/publish", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void deleteArticle_asOwner_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Delete Owner Category");
        long articleId = createArticle(userToken, articlePayload("Owner Deletable", categoryId, "DRAFT", "delete-owner"));

        mockMvc.perform(delete("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isOk());
    }

    @Test
    void deleteArticle_asManager_onOthersArticle_returns403() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long categoryId = createCategory(adminToken, "Delete Manager Category");
        long articleId = createArticle(ownerToken, articlePayload("Manager Cannot Delete", categoryId, "DRAFT", "deny-delete"));

        mockMvc.perform(delete("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void deleteArticle_asAdmin_onAnyArticle_returns200() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Delete Admin Category");
        long articleId = createArticle(ownerToken, articlePayload("Admin Deletes", categoryId, "DRAFT", "admin-delete"));

        mockMvc.perform(delete("/api/articles/{id}", articleId)
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
            .andExpect(status().isOk());
    }

    @Test
    void getPages_unauthenticated_returnsOnlyPublished() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        ObjectNode draftPayload = pagePayload("Draft Page", "DRAFT");
        ObjectNode publishedPayload = pagePayload("Published Page", "PUBLISHED");
        createPage(managerToken, draftPayload);
        createPage(managerToken, publishedPayload);

        mockMvc.perform(get("/api/pages"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].title", hasItem(publishedPayload.get("title").asText())))
            .andExpect(jsonPath("$[*].title", not(hasItem(draftPayload.get("title").asText()))))
            .andExpect(jsonPath("$[*].status", not(hasItem("DRAFT"))));
    }

    @Test
    void getPages_asManager_includesDraftsAfterCreation() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        ObjectNode draftPayload = pagePayload("Manager Draft Page", "DRAFT");
        createPage(managerToken, draftPayload);

        mockMvc.perform(get("/api/pages").header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].title", hasItem(draftPayload.get("title").asText())))
            .andExpect(jsonPath("$[*].status", hasItem("DRAFT")));
    }

    @Test
    void getPages_filterByStatus_asManager_returnsOnlyRequestedStatus() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        ObjectNode draftPayload = pagePayload("Filtered Draft Page", "DRAFT");
        ObjectNode publishedPayload = pagePayload("Filtered Published Page", "PUBLISHED");
        createPage(managerToken, draftPayload);
        createPage(managerToken, publishedPayload);

        mockMvc.perform(get("/api/pages")
                .param("status", "DRAFT")
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].title", hasItem(draftPayload.get("title").asText())))
            .andExpect(jsonPath("$[*].title", not(hasItem(publishedPayload.get("title").asText()))))
            .andExpect(jsonPath("$[*].status", everyItem(containsString("DRAFT"))));
    }

    @Test
    void createPage_asManager_returns201() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        ObjectNode payload = pagePayload("Manager Page", "DRAFT");

        mockMvc.perform(post("/api/pages")
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value(payload.get("title").asText()));
    }

    @Test
    void createPage_asUser_returns403() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());

        mockMvc.perform(post("/api/pages")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(pagePayload("User Page", "DRAFT").toString()))
            .andExpect(status().isForbidden());
    }

    @Test
    void publishPage_asManager_returns200() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long pageId = createPage(managerToken, pagePayload("Page To Publish", "DRAFT"));

        mockMvc.perform(patch("/api/pages/{id}/publish", pageId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void deletePage_asManager_returns403() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long pageId = createPage(managerToken, pagePayload("Protected Page", "DRAFT"));

        mockMvc.perform(delete("/api/pages/{id}", pageId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void deletePage_asAdmin_returns200() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long pageId = createPage(managerToken, pagePayload("Admin Delete Page", "DRAFT"));

        mockMvc.perform(delete("/api/pages/{id}", pageId)
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
            .andExpect(status().isOk());
    }

    @Test
    void getMedia_authenticated_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        createMedia(userToken, "auth-media.png");

        mockMvc.perform(get("/api/media").header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void getMedia_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/media"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadMedia_asUser_returns201() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());

        mockMvc.perform(multipart("/api/media")
                .file(mediaFile("upload-media.png"))
                .param("mediaType", "IMAGE")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.originalName").value("upload-media.png"))
            .andExpect(jsonPath("$.url", containsString("/media/")));
    }

    @Test
    void deleteMedia_asOwner_returns200() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long mediaId = createMedia(userToken, "owner-delete.png");

        mockMvc.perform(delete("/api/media/{id}", mediaId)
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isOk());
    }

    @Test
    void deleteMedia_asNonOwnerUser_returns403() throws Exception {
        String ownerToken = registeredUserToken(uniqueUsername());
        String otherToken = registeredUserToken(uniqueUsername());
        long mediaId = createMedia(ownerToken, "other-delete.png");

        mockMvc.perform(delete("/api/media/{id}", mediaId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void getCategories_unauthenticated_returns200() throws Exception {
        createCategory(adminToken(), "Public Category");

        mockMvc.perform(get("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void createCategory_asManager_returns201() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        ObjectNode payload = categoryPayload("Manager Category");

        mockMvc.perform(post("/api/categories")
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value(payload.get("name").asText()))
            .andExpect(jsonPath("$.parentCategoryId").doesNotExist())
            .andExpect(jsonPath("$.parentCategoryName").doesNotExist());
    }

    @Test
    void createCategory_asUser_returns403() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());

        mockMvc.perform(post("/api/categories")
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(categoryPayload("User Category").toString()))
            .andExpect(status().isForbidden());
    }

    @Test
    void updateCategory_asManager_returns200() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();
        long categoryId = createCategory(adminToken, "Editable Category");
        ObjectNode payload = categoryPayload("Updated Category");

        mockMvc.perform(put("/api/categories/{id}", categoryId)
                .header(HttpHeaders.AUTHORIZATION, bearer(managerToken))
                .contentType(MediaType.APPLICATION_JSON)
            .content(payload.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value(payload.get("name").asText()));
    }

    @Test
    void deleteCategory_asUser_returns403() throws Exception {
        String userToken = registeredUserToken(uniqueUsername());
        long categoryId = createCategory(adminToken(), "Forbidden Delete Category");

        mockMvc.perform(delete("/api/categories/{id}", categoryId)
                .header(HttpHeaders.AUTHORIZATION, bearer(userToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void deleteCategory_asAdmin_returns200() throws Exception {
        String adminToken = adminToken();
        long categoryId = createCategory(adminToken, "Admin Delete Category");

        mockMvc.perform(delete("/api/categories/{id}", categoryId)
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
            .andExpect(status().isOk());
    }

    @Test
    void getUsers_asAdmin_excludesAdminAccounts() throws Exception {
        JsonNode standardUser = register(uniqueUsername(), "Password@123");
        JsonNode promotedAdmin = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();

        assignRole(adminToken, promotedAdmin.get("id").asLong(), "ROLE_ADMIN");

        mockMvc.perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].username", hasItem(standardUser.get("username").asText())))
            .andExpect(jsonPath("$[*].username", not(hasItem("admin"))))
            .andExpect(jsonPath("$[*].username", not(hasItem(promotedAdmin.get("username").asText()))))
            .andExpect(jsonPath("$[*].roles[*]", not(hasItem("ROLE_ADMIN"))));
    }

    @Test
    void getUsers_asManager_returns403() throws Exception {
        JsonNode manager = register(uniqueUsername(), "Password@123");
        String adminToken = adminToken();
        assignRole(adminToken, manager.get("id").asLong(), "ROLE_MANAGER");
        String managerToken = login(manager.get("username").asText(), "Password@123").get("token").asText();

        mockMvc.perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, bearer(managerToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void assignRole_asAdmin_returns200() throws Exception {
        JsonNode user = register(uniqueUsername(), "Password@123");

        mockMvc.perform(put("/api/admin/users/{id}/role", user.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(rolePayload("ROLE_MANAGER").toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ROLE_MANAGER"));
    }

    @Test
    void assignRole_asAdmin_toAdminRole_returns400() throws Exception {
        JsonNode user = register(uniqueUsername(), "Password@123");

        mockMvc.perform(put("/api/admin/users/{id}/role", user.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(rolePayload("ROLE_ADMIN").toString()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Admin role cannot be assigned from the dashboard API"));
    }

    @Test
    void deactivateUser_asAdmin_returns200() throws Exception {
        JsonNode user = register(uniqueUsername(), "Password@123");

        mockMvc.perform(delete("/api/admin/users/{id}", user.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
            .andExpect(status().isOk());
    }

    @Test
    void deactivateUser_selfDeactivation_returns400() throws Exception {
        JsonNode admin = login("admin", "Admin@123");

        mockMvc.perform(delete("/api/admin/users/{id}", admin.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(admin.get("token").asText())))
            .andExpect(status().isBadRequest());
    }

    @Test
    void reactivateUser_asAdmin_allowsUserToLoginAgain() throws Exception {
        String username = uniqueUsername();
        JsonNode user = register(username, "Password@123");

        mockMvc.perform(delete("/api/admin/users/{id}", user.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(username, "Password@123").toString()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/admin/users/{id}/activate", user.get("id").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(adminToken())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User reactivated successfully"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(username, "Password@123").toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value(username));
    }

    private String uniqueUsername() {
        return "user_" + COUNTER.getAndIncrement() + "_" + UUID.randomUUID().toString().substring(0, 6);
    }

    private String uniqueName(String prefix) {
        return prefix + " " + COUNTER.getAndIncrement() + " " + UUID.randomUUID().toString().substring(0, 4);
    }

    private ObjectNode signupPayload(String username, String password) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("username", username);
        node.put("password", password);
        return node;
    }

    private ObjectNode loginPayload(String username, String password) {
        return signupPayload(username, password);
    }

    private ObjectNode categoryPayload(String name) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("name", uniqueName(name));
        node.put("description", "Category description for " + name);
        return node;
    }

    private ObjectNode articlePayload(String title, long categoryId, String status, String tags) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("title", uniqueName(title));
        node.put("body", "This is a sufficiently long article body for integration testing purposes.");
        node.put("excerpt", "A concise excerpt for testing.");
        node.put("categoryId", categoryId);
        node.put("status", status);
        node.put("tags", tags);
        return node;
    }

    private ObjectNode pagePayload(String title, String status) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("title", uniqueName(title));
        node.put("body", "This is a sufficiently long page body for integration testing purposes.");
        node.put("status", status);
        return node;
    }

    private MockMultipartFile mediaFile(String filename) {
        return new MockMultipartFile("file", filename, MediaType.IMAGE_PNG_VALUE, "fake-image-content".getBytes());
    }

    private ObjectNode rolePayload(String role) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("role", role);
        return node;
    }

    private JsonNode register(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupPayload(username, password).toString()))
            .andExpect(status().isCreated())
            .andReturn();
        return readJson(result);
    }

    private JsonNode login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload(username, password).toString()))
            .andExpect(status().isOk())
            .andReturn();
        return readJson(result);
    }

    private String registeredUserToken(String username) throws Exception {
        JsonNode response = register(username, "Password@123");
        return response.get("token").asText();
    }

    private String adminToken() throws Exception {
        return login("admin", "Admin@123").get("token").asText();
    }

    private long createCategory(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/categories")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(categoryPayload(name).toString()))
            .andExpect(status().isCreated())
            .andReturn();
        return readJson(result).get("id").asLong();
    }

    private long createArticle(String token, ObjectNode payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/articles")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isCreated())
            .andReturn();
        return readJson(result).get("id").asLong();
    }

    private long createPage(String token, ObjectNode payload) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/pages")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload.toString()))
            .andExpect(status().isCreated())
            .andReturn();
        return readJson(result).get("id").asLong();
    }

    private long createMedia(String token, String filename) throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/media")
                .file(mediaFile(filename))
                .param("mediaType", "IMAGE")
                .header(HttpHeaders.AUTHORIZATION, bearer(token)))
            .andExpect(status().isCreated())
            .andReturn();
        return readJson(result).get("id").asLong();
    }

    private void assignRole(String token, long userId, String role) throws Exception {
        mockMvc.perform(put("/api/admin/users/{id}/role", userId)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(rolePayload(role).toString()))
            .andExpect(status().isOk());
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}