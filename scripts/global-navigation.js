import 'skatejs-web-components';
import * as skate from 'skatejs';

customElements.define('global-navigation', class extends skate.Component {
	static get props () {
		return {
			model: {
				attribute: true,
				deserialize(value) {
					return JSON.parse(value);
				},
				serialize(value) {
					return JSON.stringify(value);
				}
			},
			isDropdownOpen: skate.prop.boolean({attribute: true}),
			isSearchActive: skate.prop.boolean({attribute: true})
		};
	}

	i18n(key) {
		// FIXME: lol
		return key.split('-').slice(-1).pop();
	}

	style() {
		return <style>
			@import 'http://wikiadesignsystem.com/assets/design-system.css';
			{`.wds-global-navigation {
				z-index: 5000102;
			}`}
		</style>;
	}

	logo() {
		if (!this.model.logo.header) {
			return;
		}

		// FIXME svgs should be rendered based on model data
		return <a class="wds-global-navigation__logo" href={this.model.logo.module.main.href}>
			<svg class="wds-global-navigation__logo-image wds-is-wds-company-logo-fandom" xmlns="http://www.w3.org/2000/svg" width="117" height="23" viewBox="0 0 117 23"><defs><linearGradient id="logo-fandom-gradient" x1="0%" x2="63.848%" y1="100%" y2="32.54%"><stop stop-color="#94D11F" offset="0%"/><stop stop-color="#09D3BF" offset="100%"/></linearGradient></defs><g fill-rule="evenodd"><path d="M114.543 8.924c-1.028-1.086-2.48-1.66-4.197-1.66-1.748 0-3.18.79-4.062 2.23-.882-1.44-2.315-2.23-4.063-2.23-1.71 0-3.16.574-4.19 1.66-.96 1.013-1.48 2.432-1.48 3.997v6.48h3.24v-6.48c0-1.75.89-2.75 2.445-2.75s2.444 1.01 2.444 2.76v6.48h3.24v-6.48c0-1.75.89-2.75 2.44-2.75 1.554 0 2.444 1.005 2.444 2.756v6.48h3.24v-6.48c0-1.564-.53-2.983-1.487-3.996M37.3 1.467c-.26-.038-.53-.078-.81-.078-3.886 0-6.496 2.47-6.496 6.15V19.4h3.24v-8.717h3.397V7.78h-3.39v-.263c0-2.077 1.15-3.13 3.41-3.13.22 0 .43.035.657.073.085.014.17.03.26.042l.163.024v-3l-.13-.016-.29-.05m10.31 11.923c0 2.11-1.083 3.224-3.133 3.224-2.81 0-3.23-2.02-3.23-3.224 0-2.05 1.18-3.223 3.23-3.223 2.007 0 3.03 1.058 3.135 3.226m3.254.602c-.004-.226-.007-.43-.014-.61-.153-3.774-2.594-6.12-6.373-6.12-1.95 0-3.6.62-4.77 1.792-1.1 1.096-1.7 2.627-1.7 4.31 0 3.507 2.63 6.152 6.12 6.152 1.66 0 3.01-.6 3.92-1.736.134.534.32 1.05.56 1.54l.04.08h3.264l-.09-.19c-.91-1.938-.94-3.91-.96-5.217m8.774-6.73c-1.86 0-3.436.62-4.553 1.79-1.046 1.09-1.622 2.63-1.622 4.34v6.01h3.24v-6.01c0-2.05 1.07-3.23 2.935-3.23s2.938 1.174 2.938 3.223v6.01h3.237v-6.01c0-1.7-.576-3.24-1.622-4.336-1.115-1.17-2.69-1.79-4.552-1.79m17.61 6.125c0 2.11-1.085 3.224-3.135 3.224-2.812 0-3.232-2.02-3.232-3.224 0-2.05 1.18-3.22 3.235-3.22 2.006 0 3.03 1.055 3.134 3.223m2.786 0V3.095h-3.13v4.85c-.994-.423-1.724-.68-2.962-.68-3.82 0-6.385 2.453-6.385 6.103 0 3.5 2.655 6.15 6.17 6.15 1.79 0 3.085-.51 3.94-1.56.14.55.34 1.15.58 1.71l.033.082h3.27l-.088-.19c-1.048-2.27-1.428-4.937-1.428-6.174m11.655-.003c0 2.05-1.16 3.225-3.183 3.225-2.024 0-3.184-1.175-3.184-3.224 0-2.05 1.16-3.22 3.185-3.22 2.024 0 3.184 1.175 3.184 3.225M88.52 7.26c-3.78 0-6.42 2.52-6.42 6.13s2.64 6.13 6.42 6.13 6.42-2.52 6.42-6.127c0-3.607-2.64-6.126-6.42-6.126"/><path fill="url(#logo-fandom-gradient)" d="M10.175 16.803c0 .19-.046.46-.26.666l-.81.69-7.362-6.94V8.51l8.094 7.627c.126.12.338.367.338.666zm11.21-8.096v2.525l-9.158 8.86a.673.673 0 0 1-.493.21.73.73 0 0 1-.514-.21l-.838-.76L21.384 8.707zm-6.976 4.498l-2.54 2.422-8.04-7.672a1.997 1.997 0 0 1-.01-2.9l2.54-2.423 8.04 7.672c.84.8.84 2.1 0 2.9zm-1.5-6.682L15.55 4c.406-.387.945-.6 1.52-.6.575 0 1.114.213 1.52.6l2.73 2.605-4.164 3.973-1.52-1.45-2.73-2.605zm10.17-.403L17.09.317l-.125-.12-.124.12-5.22 5.03L6.96.867 6.953.864 6.948.858l-.583-.47-.12-.098-.115.106L.052 6.11 0 6.16v5.76l.05.05 11.396 10.867.123.117.12-.117L23.07 11.97l.05-.05V6.17l-.05-.05z"/></g></svg>
			<svg class="wds-global-navigation__logo-image wds-is-wds-company-logo-powered-by-wikia" width="128" height="13" viewBox="0 0 128 13" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M3.233 8.427c.208 0 .409-.015.602-.046.194-.032.363-.091.51-.18a.986.986 0 0 0 .353-.376c.089-.163.134-.374.134-.637 0-.262-.045-.475-.134-.637a.99.99 0 0 0-.353-.377 1.395 1.395 0 0 0-.51-.178 3.69 3.69 0 0 0-.602-.046H1.819v2.477h1.414zm.497-3.89c.518 0 .958.075 1.32.226.364.15.66.349.887.596.228.247.394.528.499.845a3.158 3.158 0 0 1 0 1.963c-.105.319-.27.603-.5.85a2.458 2.458 0 0 1-.885.596c-.363.15-.803.226-1.321.226H1.819v2.964H0V4.536h3.73zm5.696 5.181c.08.328.21.623.388.885.177.262.41.472.695.63.286.16.633.238 1.043.238.409 0 .757-.079 1.043-.237.286-.159.517-.369.695-.631a2.71 2.71 0 0 0 .388-.885c.08-.328.122-.666.122-1.013a4.53 4.53 0 0 0-.122-1.054 2.799 2.799 0 0 0-.388-.908 1.968 1.968 0 0 0-.695-.637c-.286-.158-.634-.238-1.043-.238-.41 0-.757.08-1.043.238-.286.158-.518.37-.695.637a2.749 2.749 0 0 0-.388.908 4.471 4.471 0 0 0 0 2.067M7.763 6.985c.186-.528.452-.989.8-1.384a3.665 3.665 0 0 1 1.28-.925c.507-.224 1.077-.336 1.71-.336.64 0 1.213.112 1.715.336.502.223.927.533 1.275.925.347.395.614.856.8 1.384a5.19 5.19 0 0 1 .277 1.72 5.01 5.01 0 0 1-.278 1.684 4.017 4.017 0 0 1-.8 1.36 3.664 3.664 0 0 1-1.274.909c-.502.22-1.074.33-1.715.33-.633 0-1.203-.11-1.708-.33a3.654 3.654 0 0 1-1.281-.909 4.017 4.017 0 0 1-.8-1.36 4.981 4.981 0 0 1-.278-1.684c0-.617.092-1.19.278-1.72m15.282 5.818l-1.402-5.627h-.023l-1.38 5.627H18.4l-2.19-8.266h1.818l1.31 5.627h.023L20.8 4.537h1.7l1.414 5.695h.023l1.356-5.695h1.785l-2.225 8.266zm11.169-8.266v1.528h-4.368v1.771h4.01V9.25h-4.01v2.025h4.46v1.528h-6.28V4.537zm5.249 3.739c.417 0 .73-.092.939-.278.208-.185.312-.485.312-.903 0-.4-.104-.692-.312-.874-.21-.181-.522-.272-.94-.272h-1.992v2.327h1.993zm.649-3.74c.37 0 .705.061 1.002.18.297.12.552.284.764.492.213.21.375.45.487.723.111.274.168.57.168.887 0 .485-.103.906-.306 1.262-.206.354-.54.625-1.003.81v.023c.223.061.41.156.556.284a1.6 1.6 0 0 1 .36.451c.092.174.16.364.202.573.042.208.07.416.087.625.007.132.016.285.023.464.008.177.02.358.041.543.019.186.05.36.092.527.043.166.107.307.19.422H40.96a3.17 3.17 0 0 1-.186-.937c-.024-.363-.058-.71-.104-1.042-.062-.433-.193-.748-.394-.95-.201-.2-.53-.3-.985-.3h-1.82v3.23h-1.819V4.536h4.462zm10.207.001v1.528h-4.368v1.771h4.01V9.25h-4.01v2.025h4.46v1.528h-6.28V4.537zm4.878 6.738c.263 0 .517-.043.764-.128a1.7 1.7 0 0 0 .662-.422c.192-.197.347-.453.463-.77.116-.317.173-.702.173-1.157 0-.417-.04-.794-.12-1.13a2.278 2.278 0 0 0-.4-.863 1.776 1.776 0 0 0-.736-.548c-.305-.129-.683-.192-1.13-.192h-1.298v5.21h1.622zm.128-6.738c.532 0 1.03.085 1.49.254.458.17.856.425 1.192.765.335.34.598.764.789 1.273.188.51.282 1.108.282 1.795 0 .602-.077 1.157-.23 1.666-.155.51-.39.95-.702 1.32-.313.37-.704.662-1.17.875-.468.212-1.018.318-1.65.318h-3.57V4.537h3.57zm12.235 6.853c.178 0 .348-.016.51-.052.162-.034.305-.092.43-.174a.875.875 0 0 0 .294-.33c.073-.138.11-.316.11-.532 0-.423-.12-.727-.358-.908-.24-.182-.556-.273-.95-.273h-1.983v2.27h1.947zm-.104-3.508c.324 0 .59-.076.8-.231.208-.155.312-.404.312-.753a.954.954 0 0 0-.104-.474.761.761 0 0 0-.278-.29 1.165 1.165 0 0 0-.4-.144 2.63 2.63 0 0 0-.47-.041h-1.703v1.933h1.843zm.233-3.345c.394 0 .754.035 1.078.104.324.07.602.183.834.341.231.159.411.369.539.631.126.263.19.588.19.973 0 .417-.094.765-.284 1.041-.189.28-.468.506-.84.684.51.147.891.403 1.142.77.25.366.376.808.376 1.326 0 .416-.08.776-.242 1.082a2.12 2.12 0 0 1-.656.746 2.897 2.897 0 0 1-.938.43 4.255 4.255 0 0 1-1.083.137h-4.01V4.537h3.894zm3.486 0h2.04l1.934 3.265 1.923-3.265h2.028L76.03 9.63v3.172h-1.819V9.584z" fill="#656E78"/><path d="M102.992.404V12.81h2.79v-2.233l.96-.913 1.9 3.146h3.617l-3.487-5.004 3.346-3.268h-3.989l-1.604 1.89-.744.929V.404zM92.934 4.536l-1.05 5.649-1.375-5.65H87.3l-1.353 5.65-1.056-5.65H81.98l2.15 8.272h3.737l1.047-4.292 1.047 4.292H93.7l2.155-8.271zm32.036 5.173c-.355.463-.912.772-1.64.772-.834 0-1.5-.54-1.5-1.824 0-1.283.666-1.824 1.5-1.824.728 0 1.285.31 1.64.773V9.71zm2.784-2.767l.155-2.406h-2.546l-.192.906c-.587-.617-1.316-1.128-2.598-1.128-2.322 0-3.59 1.5-3.59 4.343 0 2.844 1.268 4.343 3.59 4.343 1.282 0 2.011-.51 2.598-1.128l.2.936h2.538l-.155-2.435V6.942zM98.83.45a1.594 1.594 0 1 0-.001 3.187A1.594 1.594 0 0 0 98.83.45m2.402 5.83V4.536h-3.996v8.272h3.996v-1.735h-1.253V6.28zM114.4 2.043a1.595 1.595 0 0 0 3.19 0 1.595 1.595 0 1 0-3.19 0m.445 4.237v4.793h-1.252v1.735h3.997V4.536h-3.997V6.28z" fill="#092344"/></g></svg>
		</a>;
	}

	fandomOverviewLinks() {
		if (!this.model.fandom_overview || !this.model.fandom_overview.links) {
			return;
		}

		return this.model.fandom_overview.links.map((link) => this.linkBranded(link));
	}

	links(model, type) {
		if (model.header) {
			return this.dropdown(model, type);
		} else {
			return model.links.map((link) => this.link(link));
		}
	}

	userMenu(model) {
		if (model.user) {
			return this.userMenuLoggedIn(model.user);
		} else if (model.anon) {
			return this.userMenuAnon(model.anon);
		}
	}

	userMenuAnon(model) {
		// TODO make this.dropdown() generic enough to use here
		const toggleHeaderSvg = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="wds-icon wds-icon-small wds-icon" id="wds-icons-user"><path d="M12 14c3.309 0 6-2.691 6-6V6c0-3.309-2.691-6-6-6S6 2.691 6 6v2c0 3.309 2.691 6 6 6zm5 2H7c-3.86 0-7 3.14-7 7a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1c0-3.86-3.14-7-7-7z" fill-rule="evenodd"></path></svg>;
		const toggleHeaderSpan = <span class="wds-global-navigation__account-menu-caption">{this.i18n(model.header.title.key)}</span>;
		const links = model.links.map((link) => this.linkAuthentication(link));

		return <div class="wds-dropdown wds-global-navigation__account-menu">
			<div class="wds-global-navigation__dropdown-toggle wds-dropdown__toggle">
				{toggleHeaderSvg}
				{toggleHeaderSpan}
				<svg class="wds-icon wds-icon-tiny wds-dropdown__toggle-chevron" width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M1 3h10L6 9z"/></svg>
			</div>
			<div class="wds-global-navigation__dropdown-content wds-dropdown__content wds-is-right-aligned">
				<ul class="wds-list wds-has-lines-between">{links}</ul>
			</div>
		</div>;
	}

	userMenuLoggedIn(model) {
		return this.links(model, 'user-menu', true);
	}

	link(model) {
		return <a class="wds-global-navigation__link" href={model.href}>{this.i18n(model.title.key)}</a>;
	}

	linkAuthentication(model) {
		const classMap = {
			'global-navigation-anon-sign-in': 'wds-button wds-is-full-width',
			'global-navigation-anon-register': 'wds-button wds-is-full-width wds-is-secondary',
			'global-navigation-user-sign-out': 'wds-global-navigation__dropdown-link'
		};
		const classNames = classMap[model.title.key];
		const subtitle = (model.subtitle) ?
			<div class="wds-global-navigation__account-menu-dropdown-caption">{this.i18n(model.subtitle.key)}</div> :
			'';
		let link;

		link = <a href={model.href} rel="nofollow" id={model.title.key} class={classNames}>{this.i18n(model.title.key)}</a>;

		return <li>{subtitle}{link}</li>;
	}

	linkBranded(model) {
		let classNames = ['wds-global-navigation__link'];

		classNames.push(`wds-is-${model.brand}`);

		return <a class={classNames.join(' ')} href={model.href}>{this.i18n(model.title.key)}</a>;
	}

	dropdown(model, type) {
		const classNames = [
				`wds-dropdown`,
				`wds-global-navigation__${type}`
			],
			links = model.links.map((link) => {
				return <li>
					<a class="wds-global-navigation__dropdown-link" href={link.href}>{this.i18n(link.title.key)}</a>
				</li>;
			});

		return <div class={classNames.join(' ')}>
			<div class="wds-global-navigation__dropdown-toggle wds-dropdown__toggle" title={this.dropdownToggleTitle(model)}>
				{this.dropdownToggleHeader(model)}
				<svg class="wds-icon wds-icon-tiny wds-dropdown__toggle-chevron" width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M1 3h10L6 9z"/></svg>
			</div>
			<div class="wds-global-navigation__dropdown-content wds-dropdown__content">
				<ul class="wds-is-linked wds-list">
					{links}
				</ul>
			</div>
		</div>;
	}

	dropdownToggleTitle(model) {
		if (model.header.type === 'avatar') {
			return model.header.username.value;
		}
	}

	dropdownToggleHeader(model) {
		if (model.header.type === 'avatar') {
			return <img class="wds-avatar" src={model.header.url} alt={model.header.username.value} />;
		} else {
			return <span>{this.i18n(model.header.title.key)}</span>;
		}
	}

	activateSearch() {
		const $globalNav = $(this.root),
			activeSearchClass = 'wds-search-is-active',
			$searchInput = $(this.searchInput);
		if (!$globalNav.hasClass(activeSearchClass)) {
			$globalNav.addClass(activeSearchClass);
			$searchInput.attr('placeholder', $searchInput.data('active-placeholder'));
			this.isSearchActive = true;

			/**
			 * [bug fix]: On Firefox click is not triggered when placeholder text is changed
			 * that is why we have to do it manually
			 */
			$(this).click();
		}
	}

	deactivateSearch() {
		const $globalNav = $(this.root),
			$searchInput = $(this.searchInput),
			$searchSubmit = $(this.searchSubmit),
			placeholderText = $searchInput.attr('placeholder'),
			activeSearchClass = 'wds-search-is-active';
		$searchSubmit.prop('disabled', true);
		$globalNav.removeClass(activeSearchClass);
		$searchInput.attr('placeholder', placeholderText).val('');
		this.isSearchActive = false;
	}

	searchKeydown(event) {
		// Escape key
		if (event.which === 27) {
			this.blur();
			this.deactivateSearch();
		}
	}

	searchOnInput() {
		const $searchSubmit = $(this.searchSubmit);
		var textLength = this.searchInput.value.length;

		if (textLength > 0 && $searchSubmit.prop('disabled')) {
			$searchSubmit.prop('disabled', false);
		} else if (textLength === 0) {
			$searchSubmit.prop('disabled', true);
		}
	}

	onClick(event) {
		const $eventTarget = $(event.target),
			$clickedToggle = $eventTarget.closest('.wds-dropdown__toggle'),
			$clickedDropdown = $eventTarget.closest('.wds-dropdown');

		if ($clickedToggle.length) {
			$clickedDropdown.toggleClass('wds-is-active');

			if ($clickedDropdown.hasClass('wds-is-active')) {
				skate.emit($eventTarget.get(0), 'wdsDropdownOpen');
			} else {
				skate.emit($eventTarget.get(0), 'wdsDropdownClose');
			}
		}

		this.closeDropdowns($(this.root).find('.wds-dropdown.wds-is-active').not($clickedDropdown));

		this.isDropdownOpen = $clickedDropdown.hasClass('wds-is-active');
	}

	updatedCallback (previousProps) {
		// The 'previousProps' will be undefined if it is the initial render.
		if (!previousProps) {
			return true;
		}

		if (!this.isDropdownOpen) {
			this.closeDropdowns($(this.root).find('.wds-dropdown.wds-is-active'));
		}
	}

	closeDropdowns(openDropdowns) {
		openDropdowns.removeClass('wds-is-active');
		openDropdowns.each(function () {
			skate.emit(this, 'wdsDropdownClose');
		});
	}

	renderedCallback () {
		if ($(this.searchInput).is(':focus')) {
			this.activateSearch();
		}

		if ($(this.searchInput).val().length === 0) {
			$(this.searchSubmit).prop('disabled', true);
		}
	}

	renderCallback () {
		return <div class="wds-global-navigation" onClick={this.onClick.bind(this)} ref={(element) => {this.root = element;}}>
			{this.style()}
			<div class="wds-global-navigation__content-bar">
				{this.logo()}
				<div class="wds-global-navigation__links-and-search">
					{this.fandomOverviewLinks()}
					{this.links(this.model.wikis, 'wikis-menu')}
					<form class="wds-global-navigation__search" action={this.model.search.module.results.url}>
						<div class="wds-global-navigation__search-input-wrapper wds-dropdown ">
							<label class="wds-dropdown__toggle wds-global-navigation__search-label">
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-label-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd"><path d="M21.747 20.524l-4.872-4.871a.864.864 0 1 0-1.222 1.222l4.871 4.872a.864.864 0 1 0 1.223-1.223z"/><path d="M3.848 10.763a6.915 6.915 0 0 1 6.915-6.915 6.915 6.915 0 0 1 6.915 6.915 6.915 6.915 0 0 1-6.915 6.915 6.915 6.915 0 0 1-6.915-6.915zm-1.729 0a8.643 8.643 0 0 0 8.644 8.644 8.643 8.643 0 0 0 8.644-8.644 8.643 8.643 0 0 0-8.644-8.644 8.643 8.643 0 0 0-8.644 8.644z"/></g></svg>
								<input type="search" name="query" placeholder="Search" autocomplete="off" class="wds-global-navigation__search-input" ref={(el) => { this.searchInput = el; }} onFocus={this.activateSearch.bind(this)} onKeydown={this.searchKeydown.bind(this)} onInput={this.searchOnInput.bind(this)}/>
							</label>
							<button class="wds-button wds-is-text wds-global-navigation__search-close" type="reset" data-ember-action="690" onClick={this.deactivateSearch.bind(this)}>
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-close-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.707 4.293a.999.999 0 0 0-1.414 0L12 10.586 5.707 4.293a.999.999 0 1 0-1.414 1.414L10.586 12l-6.293 6.293a.999.999 0 1 0 1.414 1.414L12 13.414l6.293 6.293a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L13.414 12l6.293-6.293a.999.999 0 0 0 0-1.414" fill-rule="evenodd"/></svg>
							</button>
							<div class="wds-dropdown__content wds-global-navigation__search-suggestions">
								<ul class="wds-has-ellipsis wds-is-linked wds-list"></ul>
							</div>
							<button class="wds-button wds-global-navigation__search-submit" type="button" disabled ref={(el) => { this.searchSubmit = el; }}>
								<svg class="wds-icon wds-icon-small wds-global-navigation__search-submit-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.999 12a1 1 0 0 0-1-1H4.413l5.293-5.293a.999.999 0 1 0-1.414-1.414l-7 7a1 1 0 0 0 0 1.415l7 7a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.415L4.413 13h17.586a1 1 0 0 0 1-1" fill-rule="evenodd"/></svg>
							</button>
						</div>
					</form>
				</div>
				{this.userMenu(this.model)}
				<div class="wds-global-navigation__start-a-wiki">
					<a class="wds-global-navigation__start-a-wiki-button wds-button wds-is-squished wds-is-secondary" href="http://www.wikia.com/Special:CreateNewWiki">
						<span class="wds-global-navigation__start-a-wiki-caption">Start a Wiki</span>
						<svg class="wds-global-navigation__start-a-wiki-icon wds-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 13v9a1 1 0 1 0 2 0v-9h9a1 1 0 1 0 0-2h-9V2a1 1 0 1 0-2 0v9H2a1 1 0 1 0 0 2h9z" fill-rule="evenodd"/></svg>
					</a>
				</div>
			</div>
		</div>
	}
});
