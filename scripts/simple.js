import 'skatejs-web-components';
import * as skate from 'skatejs';
const React = { createElement: skate.h };
const { elementOpen, elementClose, elementVoid, text } = skate.vdom;

customElements.define('wds-global-navigation', class extends skate.Component {
	static get props () {
		return {
			name: { attribute: true }
		};
	}
	renderCallback () {
		return <div class="wds-global-navigation">
			<style>@import 'http://wikiadesignsystem.com/assets/design-system.css'</style>
			<div class="wds-global-navigation__content-bar">
				<a class="wds-global-navigation__logo" href="http://fandom.wikia.com">
					<svg class="wds-global-navigation__logo-image wds-is-wds-company-logo-fandom">
						<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-company-logo-fandom"></use>
					</svg>
					<svg class="wds-global-navigation__logo-image wds-is-wds-company-logo-powered-by-wikia">
						<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-company-logo-powered-by-wikia"></use>
					</svg>
				</a>
				<div class="wds-global-navigation__links-and-search">
					<a class="wds-global-navigation__link wds-is-games">Games</a>
					<a class="wds-global-navigation__link wds-is-movies">Movies</a>
					<a class="wds-global-navigation__link wds-is-tv">TV</a>
					<div class="wds-global-navigation__wikis-menu wds-dropdown">
						<div class="wds-global-navigation__dropdown-toggle wds-dropdown__toggle">
							<span>Wikis</span>
							<svg class="wds-icon wds-icon-tiny wds-dropdown__toggle-chevron">
								<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-dropdown-tiny"></use>
							</svg>
						</div>
						<div class="wds-global-navigation__dropdown-content wds-dropdown__content">
							<ul class="wds-is-linked wds-list">
								<li>
									<a class="wds-global-navigation__dropdown-link">Explore Wikis</a>
								</li>
								<li>
									<a class="wds-global-navigation__dropdown-link">Community Central</a>
								</li>
								<li>
									<a class="wds-global-navigation__dropdown-link">Fandom University</a>
								</li>
							</ul>
						</div>
					</div>
					<form class="wds-global-navigation__search">
						<div class="wds-global-navigation__search-input-wrapper wds-dropdown ">
							<label class="wds-dropdown__toggle wds-global-navigation__search-label">
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-label-icon">
									<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-magnifying-glass"></use>
								</svg>
								<input type="search" name="query" placeholder="Search" autocomplete="off" class="wds-global-navigation__search-input"/>
							</label>
							<button class="wds-button wds-is-text wds-global-navigation__search-close" type="reset" data-ember-action="690">
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-close-icon">
									<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-cross"></use>
								</svg>
							</button>
							<div class="wds-dropdown__content wds-global-navigation__search-suggestions">
								<ul class="wds-has-ellipsis wds-is-linked wds-list"></ul>
							</div>
							<button class="wds-button wds-global-navigation__search-submit" type="button" disabled>
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-submit-icon">
									<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-arrow"></use>
								</svg>
							</button>
						</div>
					</form>
				</div>
				<div class="wds-global-navigation__account-menu wds-dropdown">
					<div class="wds-global-navigation__dropdown-toggle wds-dropdown__toggle">
						<svg class="wds-icon wds-icon-small">
							<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-user"></use>
						</svg>
						<span class="wds-global-navigation__account-menu-caption">My Account</span>
						<svg class="wds-icon wds-icon-tiny wds-dropdown__toggle-chevron">
							<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-dropdown-tiny"></use>
						</svg>
					</div>
					<div class="wds-global-navigation__dropdown-content wds-dropdown__content wds-is-right-aligned">
						<ul class="wds-has-lines-between wds-list">
							<li>
								<a rel="nofollow" href="" class="wds-button wds-is-full-width">Sign In</a>
							</li>
							<li>
								<div class="wds-global-navigation__account-menu-dropdown-caption">Don't have an account?</div>
								<a rel="nofollow" href="" class="wds-button wds-is-full-width wds-is-secondary">Register</a>
							</li>
						</ul>
					</div>
				</div>
				<div class="wds-global-navigation__start-a-wiki">
					<a class="wds-global-navigation__start-a-wiki-button wds-button wds-is-squished wds-is-secondary" href="http://www.wikia.com/Special:CreateNewWiki">
						<span class="wds-global-navigation__start-a-wiki-caption">Start a Wiki</span>
						<svg class="wds-global-navigation__start-a-wiki-icon wds-icon">
							<use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref="#wds-icons-plus"></use>
						</svg>
					</a>
				</div>
			</div>
		</div>
	}
});
