<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.Map" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="com.tap.model.Menu" %>
<%@ page import="com.tap.model.MenuCategory" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.User" %>
<%
    Restaurant restaurant = (Restaurant) request.getAttribute("restaurant");
    List<Menu> menuList = (List<Menu>) request.getAttribute("menuList");
    List<MenuCategory> categories = (List<MenuCategory>) request.getAttribute("categories");
    Integer restaurantId = (Integer) request.getAttribute("restaurantId");
    
    if (restaurantId == null) {
        String rParam = request.getParameter("restaurantId");
        if (rParam == null) rParam = request.getParameter("restaurant_id");
        if (rParam != null && !rParam.isBlank()) {
            try { restaurantId = Integer.parseInt(rParam.trim()); } catch (Exception ignored) {}
        }
    }
    if (restaurantId == null && restaurant != null) {
        restaurantId = restaurant.getRestaurantId();
    }
    if (restaurantId != null) {
        if (restaurant == null) {
            try { restaurant = new com.tap.daoimpl.RestaurantDAOImpl().getRestaurantById(restaurantId); } catch (Exception ignored) {}
        }
        if (menuList == null || menuList.isEmpty()) {
            try { menuList = new com.tap.daoimpl.MenuDAOImpl().getMenuByRestaurantId(restaurantId); } catch (Exception ignored) {}
        }
        if (categories == null || categories.isEmpty()) {
            try { categories = new com.tap.daoimpl.MenuDAOImpl().getCategoriesByRestaurantId(restaurantId); } catch (Exception ignored) {}
        }
    }

    // Group menu items by categoryId
    Map<Integer, List<Menu>> itemsByCategory = new HashMap<>();
    if (menuList != null) {
        for (Menu m : menuList) {
            itemsByCategory.computeIfAbsent(m.getCategoryId(), k -> new ArrayList<>()).add(m);
        }
    }

    Cart cart = (Cart) session.getAttribute("cart");
    if (cart == null) {
        cart = new Cart();
        session.setAttribute("cart", cart);
    }
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    int cartCount = cart.getItemCount();
    double cartTotal = cart.getTotalAmount();
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= (restaurant != null ? restaurant.getName() : "Menu") %> - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
</head>
<body>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala
            </a>
            <nav class="nav-links">
                <a href="<%=request.getContextPath()%>/restaurants" class="nav-link">Restaurants</a>
                <a href="<%=request.getContextPath()%>/cart" class="nav-link" id="nav-cart-link">
                    🛒 Cart <span class="nav-badge" id="nav-cart-badge" style="<%= cartCount > 0 ? "" : "display:none;" %>"><%=cartCount%></span>
                </a>
                <% if(loggedInUser != null) { %>
                    <span class="user-pill">👤 <%=loggedInUser.getUsername()%></span>
                    <a href="<%=request.getContextPath()%>/profile" class="nav-link">My Profile</a>
                    <a href="<%=request.getContextPath()%>/orders" class="nav-link">My Orders</a>
                    <% if(loggedInUser.isRestaurant() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/restaurant/dashboard" class="nav-link" style="color:#d97706; font-weight:700;">🍽️ Rest. Portal</a>
                    <% } %>
                    <% if(loggedInUser.isDeliveryPartner() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/delivery/dashboard" class="nav-link" style="color:#2563eb; font-weight:700;">🛵 Delivery Portal</a>
                    <% } %>
                    <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
                <% } else { %>
                    <a href="<%=request.getContextPath()%>/login" class="nav-link">Login</a>
                    <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
                <% } %>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <div style="margin-bottom: 20px;">
            <a href="<%=request.getContextPath()%>/restaurants" class="nav-link" style="display: inline-flex; font-size: 14px;">
                ← Back to All Bengaluru Restaurants
            </a>
        </div>

        <% if (request.getParameter("added") != null) { %>
            <div class="alert alert-success" id="cart-alert">
                ✅ Dish added to your cart! 
                <a href="<%=request.getContextPath()%>/cart" style="color: inherit; font-weight: 700; text-decoration: underline; margin-left: 8px;">
                    View Cart (<span class="alert-cart-count"><%=cartCount%></span> items) →
                </a>
            </div>
        <% } %>

        <!-- RESTAURANT BANNER -->
        <% if (restaurant != null) { %>
            <div class="restaurant-banner">
                <div class="banner-details">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <h1 style="margin: 0;"><%=restaurant.getName()%></h1>
                        <% if (restaurant.isOpen()) { %>
                            <span class="badge-open" style="position: static;">🟢 Open</span>
                        <% } else { %>
                            <span class="badge-closed" style="position: static;">🔴 Closed</span>
                        <% } %>
                        <% if (restaurant.isPopular()) { %>
                            <span class="badge-popular" style="margin: 0;">🔥 Popular</span>
                        <% } %>
                    </div>
                    <p style="font-size: 15px; margin-bottom: 6px; font-weight: 600;"><%=restaurant.getCuisineType()%></p>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">📍 <%=restaurant.getAddress()%></p>
                    <p style="font-size: 12px; color: var(--text-muted);">🕒 <%=restaurant.getOpeningTime()%> – <%=restaurant.getClosingTime()%></p>
                </div>
                <div class="banner-meta">
                    <div class="meta-box">
                        <div class="meta-value" style="color: #047857;">⭐ <%=String.format(java.util.Locale.US, "%.1f", restaurant.getRating())%></div>
                        <div class="meta-label"><%=restaurant.getReviewCount() > 0 ? restaurant.getReviewCount() + "+ Reviews" : "Rating"%></div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-value">⚡ <%=restaurant.getDeliveryTime()%></div>
                        <div class="meta-label">Mins Delivery</div>
                    </div>
                    <div class="meta-box">
                        <div class="meta-value">₹<%=Math.round(restaurant.getDeliveryFee())%></div>
                        <div class="meta-label">Delivery Fee</div>
                    </div>
                </div>
            </div>
        <% } %>

        <!-- SEARCH & DIETARY FILTER BAR FOR MENU -->
        <div class="discovery-container" style="padding: 14px 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                <div class="search-input-group" style="max-width: 400px;">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="menuSearchInput" placeholder="Search dishes in this menu..." autocomplete="off">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button type="button" class="filter-chip" id="vegFilterChip" onclick="toggleMenuVegFilter(this)">
                        🟢 Veg Only
                    </button>
                    <button type="button" class="filter-chip" id="popularFilterChip" onclick="toggleMenuPopularFilter(this)">
                        ⭐ Bestsellers
                    </button>
                </div>
            </div>
        </div>

        <!-- STICKY CATEGORY TABS -->
        <% if (categories != null && !categories.isEmpty()) { %>
            <div class="category-nav-bar">
                <div class="category-nav-scroll">
                    <button type="button" class="category-nav-btn active" onclick="filterByCategory(0, this)">
                        All Dishes (<%=menuList != null ? menuList.size() : 0%>)
                    </button>
                    <% for (MenuCategory cat : categories) { 
                        List<Menu> cItems = itemsByCategory.getOrDefault(cat.getCategoryId(), new ArrayList<>());
                    %>
                        <button type="button" class="category-nav-btn" onclick="filterByCategory(<%=cat.getCategoryId()%>, this)">
                            <%=cat.getName()%> (<%=cItems.size()%>)
                        </button>
                    <% } %>
                </div>
            </div>
        <% } %>

        <!-- MENU ITEMS SECTION -->
        <% if (menuList == null || menuList.isEmpty()) { %>
            <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3 class="empty-title">No menu items found</h3>
                <p class="empty-subtitle">Items for this restaurant will be available shortly.</p>
                <a href="<%=request.getContextPath()%>/restaurants" class="btn">Browse Other Restaurants</a>
            </div>
        <% } else { %>
            
            <div id="categorizedMenuContainer">
                <% 
                if (categories != null && !categories.isEmpty()) {
                    for (MenuCategory cat : categories) {
                        List<Menu> catItems = itemsByCategory.getOrDefault(cat.getCategoryId(), new ArrayList<>());
                        if (catItems.isEmpty()) continue;
                %>
                        <div class="category-section" id="cat-section-<%=cat.getCategoryId()%>" data-category-id="<%=cat.getCategoryId()%>">
                            <div class="category-section-title">
                                <span><%=cat.getName()%></span>
                                <span class="cat-count"><%=catItems.size()%> items</span>
                            </div>
                            <div class="menu-grid">
                                <% for (Menu item : catItems) { 
                                    String img = item.getImagePath();
                                    if (img == null || img.trim().isEmpty()) {
                                        img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                                    }
                                    int itemCartQty = cart.getQuantity(item.getMenuId());
                                    boolean inCart = itemCartQty > 0;
                                    String safeItemName = item.getItemName() != null ? item.getItemName().replace("\"", "&quot;") : "";
                                %>
                                    <div class="menu-card" id="dish-card-<%=item.getMenuId()%>"
                                         data-category-id="<%=item.getCategoryId()%>"
                                         data-veg="<%=item.isVeg()%>"
                                         data-popular="<%=item.isPopular()%>"
                                         data-name="<%=safeItemName.toLowerCase()%>">
                                        <div class="menu-card-left">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <% if (item.isVeg()) { %>
                                                    <span class="veg-tag" title="Pure Vegetarian"></span>
                                                <% } else { %>
                                                    <span class="nonveg-tag" title="Non-Vegetarian"></span>
                                                <% } %>
                                                <% if (item.isPopular()) { %>
                                                    <span class="badge-popular">⭐ Bestseller</span>
                                                <% } %>
                                            </div>
                                            <div class="item-title"><%=item.getItemName()%></div>
                                            <div class="item-price">₹<%=String.format(java.util.Locale.US, "%.2f", item.getPrice())%></div>
                                            <div style="font-size: 12px; color: #047857; font-weight: 700; margin-bottom: 4px;">
                                                ⭐ <%=item.getRating() > 0 ? item.getRating() : 4.5%>
                                                <% if (item.getPreparationTime() != null && !item.getPreparationTime().isBlank()) { %>
                                                    <span style="color: var(--text-muted); font-weight: 500; margin-left: 8px;">🕒 <%=item.getPreparationTime()%></span>
                                                <% } %>
                                            </div>
                                            <div class="item-desc"><%= (item.getDescription() != null && !item.getDescription().isBlank()) ? item.getDescription() : "Prepared fresh with finest ingredients." %></div>
                                        </div>

                                        <div class="menu-card-right">
                                            <img src="<%=img%>" alt="<%=safeItemName%>" class="menu-item-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c';">
                                            
                                            <!-- QUANTITY / CART CONTROL SYNCHRONIZED WITH CART -->
                                            <div class="dish-action-container" id="dish-action-<%=item.getMenuId()%>"
                                                 data-item-id="<%=item.getMenuId()%>"
                                                 data-restaurant-id="<%=restaurantId%>"
                                                 data-name="<%=safeItemName%>"
                                                 data-price="<%=item.getPrice()%>">

                                                <% if (inCart) { %>
                                                    <div class="qty-counter menu-cart-counter">
                                                        <form action="<%=request.getContextPath()%>/cart" method="post" class="sync-cart-form dec-form" style="display:inline;">
                                                            <input type="hidden" name="action" value="update">
                                                            <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                            <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                            <input type="hidden" name="quantity" value="<%=itemCartQty - 1%>">
                                                            <input type="hidden" name="redirect" value="menu">
                                                            <button type="submit" class="qty-btn" title="Decrease quantity">−</button>
                                                        </form>

                                                        <span class="qty-val"><%=itemCartQty%></span>

                                                        <form action="<%=request.getContextPath()%>/cart" method="post" class="sync-cart-form inc-form" style="display:inline;">
                                                            <input type="hidden" name="action" value="update">
                                                            <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                            <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                            <input type="hidden" name="quantity" value="<%=itemCartQty + 1%>">
                                                            <input type="hidden" name="redirect" value="menu">
                                                            <button type="submit" class="qty-btn" title="Increase quantity">+</button>
                                                        </form>
                                                    </div>
                                                <% } else { %>
                                                    <form action="<%=request.getContextPath()%>/cart" method="post" class="add-form initial-add-form">
                                                        <input type="hidden" name="action" value="add">
                                                        <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                        <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                        <input type="hidden" name="name" value="<%=safeItemName%>">
                                                        <input type="hidden" name="price" value="<%=item.getPrice()%>">
                                                        <input type="hidden" name="redirect" value="menu">
                                                        
                                                        <div class="qty-counter" style="margin-bottom: 6px;">
                                                            <button type="button" class="qty-btn" onclick="decrementInitialQty(this)" title="Decrease quantity">−</button>
                                                            <input type="number" name="quantity" value="1" min="1" max="10" class="qty-val-input" title="Quantity">
                                                            <button type="button" class="qty-btn" onclick="incrementInitialQty(this)" title="Increase quantity">+</button>
                                                        </div>
                                                        <button type="submit" class="btn btn-sm" style="padding: 6px 14px; width: 100%;">+ Add</button>
                                                    </form>
                                                <% } %>

                                            </div>
                                        </div>
                                    </div>
                                <% } %>
                            </div>
                        </div>
                <% 
                    }
                } else { 
                %>
                    <div class="menu-grid">
                        <% for (Menu item : menuList) { 
                            String img = item.getImagePath();
                            if (img == null || img.trim().isEmpty()) {
                                img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                            }
                            int itemCartQty = cart.getQuantity(item.getMenuId());
                            boolean inCart = itemCartQty > 0;
                            String safeItemName = item.getItemName() != null ? item.getItemName().replace("\"", "&quot;") : "";
                        %>
                            <div class="menu-card" id="dish-card-<%=item.getMenuId()%>"
                                 data-category-id="<%=item.getCategoryId()%>"
                                 data-veg="<%=item.isVeg()%>"
                                 data-popular="<%=item.isPopular()%>"
                                 data-name="<%=safeItemName.toLowerCase()%>">
                                <div class="menu-card-left">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <% if (item.isVeg()) { %>
                                            <span class="veg-tag" title="Pure Vegetarian"></span>
                                        <% } else { %>
                                            <span class="nonveg-tag" title="Non-Vegetarian"></span>
                                        <% } %>
                                        <% if (item.isPopular()) { %>
                                            <span class="badge-popular">⭐ Bestseller</span>
                                        <% } %>
                                    </div>
                                    <div class="item-title"><%=item.getItemName()%></div>
                                    <div class="item-price">₹<%=String.format(java.util.Locale.US, "%.2f", item.getPrice())%></div>
                                    <div style="font-size: 12px; color: #047857; font-weight: 700; margin-bottom: 4px;">
                                        ⭐ <%=item.getRating() > 0 ? item.getRating() : 4.5%>
                                        <% if (item.getPreparationTime() != null && !item.getPreparationTime().isBlank()) { %>
                                            <span style="color: var(--text-muted); font-weight: 500; margin-left: 8px;">🕒 <%=item.getPreparationTime()%></span>
                                        <% } %>
                                    </div>
                                    <div class="item-desc"><%= (item.getDescription() != null && !item.getDescription().isBlank()) ? item.getDescription() : "Prepared fresh with finest ingredients." %></div>
                                </div>

                                <div class="menu-card-right">
                                    <img src="<%=img%>" alt="<%=safeItemName%>" class="menu-item-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c';">
                                    
                                    <div class="dish-action-container" id="dish-action-<%=item.getMenuId()%>"
                                         data-item-id="<%=item.getMenuId()%>"
                                         data-restaurant-id="<%=restaurantId%>"
                                         data-name="<%=safeItemName%>"
                                         data-price="<%=item.getPrice()%>">

                                        <% if (inCart) { %>
                                            <div class="qty-counter menu-cart-counter">
                                                <form action="<%=request.getContextPath()%>/cart" method="post" class="sync-cart-form dec-form" style="display:inline;">
                                                    <input type="hidden" name="action" value="update">
                                                    <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                    <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                    <input type="hidden" name="quantity" value="<%=itemCartQty - 1%>">
                                                    <input type="hidden" name="redirect" value="menu">
                                                    <button type="submit" class="qty-btn" title="Decrease quantity">−</button>
                                                </form>

                                                <span class="qty-val"><%=itemCartQty%></span>

                                                <form action="<%=request.getContextPath()%>/cart" method="post" class="sync-cart-form inc-form" style="display:inline;">
                                                    <input type="hidden" name="action" value="update">
                                                    <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                    <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                    <input type="hidden" name="quantity" value="<%=itemCartQty + 1%>">
                                                    <input type="hidden" name="redirect" value="menu">
                                                    <button type="submit" class="qty-btn" title="Increase quantity">+</button>
                                                </form>
                                            </div>
                                        <% } else { %>
                                            <form action="<%=request.getContextPath()%>/cart" method="post" class="add-form initial-add-form">
                                                <input type="hidden" name="action" value="add">
                                                <input type="hidden" name="itemId" value="<%=item.getMenuId()%>">
                                                <input type="hidden" name="restaurantId" value="<%=restaurantId%>">
                                                <input type="hidden" name="name" value="<%=safeItemName%>">
                                                <input type="hidden" name="price" value="<%=item.getPrice()%>">
                                                <input type="hidden" name="redirect" value="menu">
                                                
                                                <div class="qty-counter" style="margin-bottom: 6px;">
                                                    <button type="button" class="qty-btn" onclick="decrementInitialQty(this)" title="Decrease quantity">−</button>
                                                    <input type="number" name="quantity" value="1" min="1" max="10" class="qty-val-input" title="Quantity">
                                                    <button type="button" class="qty-btn" onclick="incrementInitialQty(this)" title="Increase quantity">+</button>
                                                </div>
                                                <button type="submit" class="btn btn-sm" style="padding: 6px 14px; width: 100%;">+ Add</button>
                                            </form>
                                        <% } %>

                                    </div>
                                </div>
                            </div>
                        <% } %>
                    </div>
                <% } %>
            </div>

        <% } %>

        <!-- FLOATING BOTTOM CART BAR -->
        <div id="floating-cart-bar" style="<%= (cartCount > 0 ? "display: flex;" : "display: none;") %> position: sticky; bottom: 20px; z-index: 100; margin-top: 35px; background: var(--dark-surface); color: white; padding: 16px 24px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); justify-content: space-between; align-items: center;">
            <div>
                <div id="floating-cart-text" style="font-weight: 800; font-size: 16px;">
                    <span id="floating-cart-count"><%=cartCount%></span> item<%= cartCount != 1 ? "s" : "" %> in Cart | ₹<span id="floating-cart-total"><%=String.format(java.util.Locale.US, "%.2f", cartTotal)%></span>
                </div>
                <div style="font-size: 12px; color: #cbd5e1;">Delivery charges and taxes calculated at checkout</div>
            </div>
            <a href="<%=request.getContextPath()%>/cart" class="btn" style="background: var(--primary); padding: 10px 22px;">
                View Cart →
            </a>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <!-- SYNCHRONIZATION & MENU FILTER SCRIPTS -->
    <script>
        const contextPath = '<%=request.getContextPath()%>';
        const currentRestaurantId = '<%=restaurantId != null ? restaurantId : 1%>';

        let selectedCategoryId = 0;
        let menuVegOnly = false;
        let menuPopularOnly = false;
        let menuSearchQuery = '';

        document.addEventListener('DOMContentLoaded', () => {
            const searchInp = document.getElementById('menuSearchInput');
            if (searchInp) {
                searchInp.addEventListener('input', (e) => {
                    menuSearchQuery = e.target.value.toLowerCase().trim();
                    filterMenuCards();
                });
            }
        });

        function filterByCategory(catId, btn) {
            selectedCategoryId = catId;
            document.querySelectorAll('.category-nav-btn').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
            filterMenuCards();
        }

        function toggleMenuVegFilter(btn) {
            menuVegOnly = !menuVegOnly;
            btn.classList.toggle('active', menuVegOnly);
            filterMenuCards();
        }

        function toggleMenuPopularFilter(btn) {
            menuPopularOnly = !menuPopularOnly;
            btn.classList.toggle('active', menuPopularOnly);
            filterMenuCards();
        }

        function filterMenuCards() {
            const sections = document.querySelectorAll('.category-section');
            const allCards = document.querySelectorAll('.menu-card');

            allCards.forEach(card => {
                const cardCatId = parseInt(card.getAttribute('data-category-id')) || 0;
                const isVeg = card.getAttribute('data-veg') === 'true';
                const isPopular = card.getAttribute('data-popular') === 'true';
                const name = card.getAttribute('data-name') || '';

                let match = true;

                if (selectedCategoryId > 0 && cardCatId !== selectedCategoryId) {
                    match = false;
                }
                if (menuVegOnly && !isVeg) {
                    match = false;
                }
                if (menuPopularOnly && !isPopular) {
                    match = false;
                }
                if (menuSearchQuery && !name.includes(menuSearchQuery)) {
                    match = false;
                }

                card.style.display = match ? 'flex' : 'none';
            });

            // Hide category section headers if all items in section are hidden
            sections.forEach(sec => {
                const visibleCards = sec.querySelectorAll('.menu-card[style*="display: flex"], .menu-card:not([style*="display: none"])');
                let countVisible = 0;
                sec.querySelectorAll('.menu-card').forEach(c => {
                    if (c.style.display !== 'none') countVisible++;
                });
                sec.style.display = countVisible > 0 ? 'block' : 'none';
            });
        }

        function decrementInitialQty(btn) {
            const input = btn.parentElement.querySelector('input');
            if (input) {
                let val = parseInt(input.value) || 1;
                if (val > 1) {
                    input.value = val - 1;
                }
            }
        }

        function incrementInitialQty(btn) {
            const input = btn.parentElement.querySelector('input');
            if (input) {
                let val = parseInt(input.value) || 1;
                if (val < 10) {
                    input.value = val + 1;
                }
            }
        }

        function updateFloatingCartBar(count, total) {
            const bar = document.getElementById('floating-cart-bar');
            const countSpan = document.getElementById('floating-cart-count');
            const totalSpan = document.getElementById('floating-cart-total');
            const textDiv = document.getElementById('floating-cart-text');
            const badge = document.getElementById('nav-cart-badge');

            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }

            if (bar) {
                if (count > 0) {
                    bar.style.display = 'flex';
                    if (countSpan) countSpan.textContent = count;
                    if (totalSpan) totalSpan.textContent = parseFloat(total).toFixed(2);
                    if (textDiv) {
                        textDiv.innerHTML = count + ' item' + (count !== 1 ? 's' : '') + ' in Cart | ₹' + parseFloat(total).toFixed(2);
                    }
                } else {
                    bar.style.display = 'none';
                }
            }
        }

        function renderItemAction(itemId, qty) {
            const container = document.getElementById('dish-action-' + itemId);
            if (!container) return;

            const restId = container.getAttribute('data-restaurant-id') || currentRestaurantId;
            const name = container.getAttribute('data-name') || '';
            const price = container.getAttribute('data-price') || '0';

            if (qty > 0) {
                container.innerHTML = 
                    '<div class="qty-counter menu-cart-counter">' +
                        '<form action="' + contextPath + '/cart" method="post" class="sync-cart-form dec-form" style="display:inline;">' +
                            '<input type="hidden" name="action" value="update">' +
                            '<input type="hidden" name="itemId" value="' + itemId + '">' +
                            '<input type="hidden" name="restaurantId" value="' + restId + '">' +
                            '<input type="hidden" name="quantity" value="' + (qty - 1) + '">' +
                            '<input type="hidden" name="redirect" value="menu">' +
                            '<button type="submit" class="qty-btn" title="Decrease quantity">−</button>' +
                        '</form>' +
                        '<span class="qty-val">' + qty + '</span>' +
                        '<form action="' + contextPath + '/cart" method="post" class="sync-cart-form inc-form" style="display:inline;">' +
                            '<input type="hidden" name="action" value="update">' +
                            '<input type="hidden" name="itemId" value="' + itemId + '">' +
                            '<input type="hidden" name="restaurantId" value="' + restId + '">' +
                            '<input type="hidden" name="quantity" value="' + (qty + 1) + '">' +
                            '<input type="hidden" name="redirect" value="menu">' +
                            '<button type="submit" class="qty-btn" title="Increase quantity">+</button>' +
                        '</form>' +
                    '</div>';
            } else {
                container.innerHTML = 
                    '<form action="' + contextPath + '/cart" method="post" class="add-form initial-add-form">' +
                        '<input type="hidden" name="action" value="add">' +
                        '<input type="hidden" name="itemId" value="' + itemId + '">' +
                        '<input type="hidden" name="restaurantId" value="' + restId + '">' +
                        '<input type="hidden" name="name" value="' + name + '">' +
                        '<input type="hidden" name="price" value="' + price + '">' +
                        '<input type="hidden" name="redirect" value="menu">' +
                        '<div class="qty-counter" style="margin-bottom: 6px;">' +
                            '<button type="button" class="qty-btn" onclick="decrementInitialQty(this)" title="Decrease quantity">−</button>' +
                            '<input type="number" name="quantity" value="1" min="1" max="10" class="qty-val-input" title="Quantity">' +
                            '<button type="button" class="qty-btn" onclick="incrementInitialQty(this)" title="Increase quantity">+</button>' +
                        '</div>' +
                        '<button type="submit" class="btn btn-sm" style="padding: 6px 14px; width: 100%;">+ Add</button>' +
                    '</form>';
            }
        }

        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.classList.contains('sync-cart-form') || form.classList.contains('initial-add-form')) {
                e.preventDefault();
                const formData = new FormData(form);
                formData.append('format', 'json');

                fetch(form.action, {
                    method: 'POST',
                    body: new URLSearchParams(formData),
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(res => res.json())
                .then(data => {
                    if (data && data.status === 'success') {
                        renderItemAction(data.itemId, data.quantity);
                        updateFloatingCartBar(data.cartCount, data.cartTotal);
                    } else {
                        form.submit();
                    }
                })
                .catch(() => {
                    form.submit();
                });
            }
        });

        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                window.location.reload();
            }
        });
    </script>
</body>
</html>