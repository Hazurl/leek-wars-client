LW.pages.market.init = function(params, $scope, $page) {

	_.get('market/get-item-templates/' + LW.token(), function(data) {

		if (!data.success) {
			LW.error()
			return
		}

		var all = []
		var weapons = []
		var chips = []
		var chipsByType = {}
		var potions = []
		var hats = []
		var previews = []

		for (var i in data.items) {
			var item = data.items[i]
			all[item.id] = item
			if (item.type == ITEM_WEAPON) {
				weapons.push(LW.weapons[item.id])
				previews[item.id] = LW.createWeaponPreview(LW.weapons[item.id])
			} else if (item.type == ITEM_CHIP) {
				var chip = LW.chips[item.id]
				chips.push(chip)
				previews[item.id] = LW.createChipPreview(chip)

				// Place the chip in the categories which correspond to its effects
				for (var y in chip.effects) {
					var type = chip.effects[y].type
					if (chipsByType[type] !== undefined) {
						if (chipsByType[type][item.id] === undefined) {
							chipsByType[type][item.id] = chip
						}
					} else {
						chipsByType[type] = {}
						chipsByType[type][item.id] = chip
					}
				}
			} else if (item.type == ITEM_POTION) {
				potions.push(LW.potions[item.id])
				previews[item.id] = LW.createPotionPreview(LW.potions[item.id])
			} else if (item.type == ITEM_HAT) {
				hats.push(LW.hats[item.id])
				previews[item.id] = LW.createHatPreview(LW.hats[item.id])
			}
		}

		$scope.items = all
		$scope.weapons = weapons
		$scope.chips = chips
		$scope.chipsByType = chipsByType
		$scope.potions = potions
		$scope.hats = hats
		$scope.previews = previews
		$page.render()

		LW.setTitle(_.lang.get('market', 'title'))
		LW.setMenuTab('market')

		// Click item
		$('.item').click(function() {
			LW.page('/market/' + $(this).attr('name'))
		})

		LW.pages.market.updateItems()
		LW.pages.market.buy()
		LW.pages.market.chips()

		// Sell buttons
		$("#market-page .item").each(function() {

			var id = $(this).attr('id')
			var count = parseInt($(this).attr('farmer-count'))

			if (count == 0) {
				$("#preview " + "#" + id).find('.sell').hide()
			}
		})

		// Flèches droites et gauche
		/*
		$(document).keydown(function(e) {
			if (e.keyCode == 37) { // Gauche
				//~ var currentItem = $('#' + currentPage).find('.selected')
				//~ var prev = currentItem.prev()
				//~ if (prev.length == 0) prev = currentItem.parent().children().last()
				//~ selectItem(prev)
				return false
			}
			if (e.keyCode == 39) { // Droite
				//~ var currentItem = $('#' + currentPage).find('.selected')
				//~ var next = currentItem.next()
				//~ if (next.length == 0) next = currentItem.parent().children().first()
				//~ selectItem(next)
				return false
			}
		})
		*/

		if ('item' in params) {
			LW.pages.market.selectItem(params.item)
		} else {
			LW.pages.market.selectItem('pistol')
		}
	})
}

LW.pages.market.resize = function() {
	$('#preview-panel').css('width', $('#preview-panel').parent('.column4').width() - 15)
}

LW.pages.market.scroll = function(scroll) {

	if (scroll < 137) {
		$('#preview-panel').css('position', 'static')
	} else {
		$('#preview-panel').css('position', 'fixed')
		$('#preview-panel').css('top', 20)
	}
}

LW.pages.market.update = function(params) {

	LW.pages.market.selectItem(params.item)
}

LW.pages.market.buy = function() {

	$('#preview .buy-button').click(function(e) {

		if ($(this).hasClass('disabled')) return null

		var buyPopup = new _.popup.new('market.buy_popup', {
			item_name: $(this).parent().parent().find('.header .name').text(),
			price: parseInt($(this).attr('price')),
			habs_before: LW.farmer.habs,
			habs_after: LW.farmer.habs - parseInt($(this).attr('price'))
		})

		var id = $(this).attr('id')
		var type = $(this).attr('type')

		buyPopup.show(e)

		buyPopup.find('.buy').click(function() {

			_.toast(_.lang.get('market', 'buying'))

			_.post('market/buy-habs', {item_id: id}, function(data) {

				if (data.success) {

					buyPopup.dismiss()

					_.toast([
						_.lang.get('market', 'weapon_bought'),
						_.lang.get('market', 'chip_bought'),
						_.lang.get('market', 'potion_bought'),
						_.lang.get('market', 'hat_bought')
					][type - 1])

					$("#item-" + id).attr('farmer-count', parseInt($("#item-" + id).attr('farmer-count')) + 1)

					$('#preview #item-' + id).find('.sell').show()

					LW.setHabs(data.money)
					LW.pages.market.updateItems()

					LW.addItemToInventory(type, data.item, id)
				}
			})
		})
	})

	// Buy item by crystals
	$('#preview .buy-crystals-button').click(function(e) {

		if ($(this).hasClass('disabled')) return null

		var buyPopup = new _.popup.new('market.buy_crystals_popup', {
			item_name: $(this).parent().parent().find('.header .name').text(),
			price: parseInt($(this).attr('price')),
			crystals_before: LW.farmer.crystals,
			crystals_after: LW.farmer.crystals - parseInt($(this).attr('price'))
		})

		var id = $(this).attr('id')
		var type = $(this).attr('type')

		buyPopup.show(e)

		buyPopup.find('.buy').click(function() {

			buyPopup.find('.buy').off()

			_.toast(_.lang.get('market', 'buying'))

			_.post('market/buy-crystals', {item_id: id}, function(data) {

				if (data.success) {

					buyPopup.dismiss()

					_.toast([
						_.lang.get('market', 'weapon_bought'),
						_.lang.get('market', 'chip_bought'),
						_.lang.get('market', 'potion_bought'),
						_.lang.get('market', 'hat_bought')
					][type - 1])

					$("#item-" + id).attr('farmer-count', parseInt($("#item-" + id).attr('farmer-count')) + 1)

					$('#preview #item-' + id).find('.sell').show()

					LW.setCrystals(data.crystals)
					LW.pages.market.updateItems()
				}
			})
		})
	})

	// Sell item
	$('#preview .sell-button').click(function(e) {

		if ($(this).hasClass('disabled')) return null

		var sellPopup = new _.popup.new('market.sell_popup', {
			item_name: $(this).parent().find('.header .name').text(),
			price: parseInt($(this).attr('price')),
			habs_before: LW.farmer.habs,
			habs_after: LW.farmer.habs + parseInt($(this).attr('price'))
		})

		var id = $(this).attr('id')
		var type = $(this).attr('type')

		sellPopup.show(e)

		sellPopup.find('.sell').click(function() {

			sellPopup.find('.buy').off()

			_.post('market/sell-habs', {item_id: id}, function(data) {

				if (data.success) {

					sellPopup.dismiss()

					_.toast([
						_.lang.get('market', 'weapon_selled'),
						_.lang.get('market', 'chip_selled'),
						_.lang.get('market', 'potion_selled'),
						_.lang.get('market', 'hat_selled')
					][type - 1])

					// On actualise
					var div = $("#item-" + id)

					$("#item-" + id).attr('farmer-count', parseInt($("#item-" + id).attr('farmer-count')) - 1)

					if ($("#item-" + id).attr('farmer-count') == 0) {
						$('#preview #item-' + id).find('.sell').hide()
					}

					LW.setHabs(data.money)
					LW.pages.market.updateItems()

					LW.removeItemFromInventory(type, id)
				}
			})
		})
	})
}

LW.pages.market.updateItems = function() {

	$('.buy-button, .buy-crystals-button').each(function() {

		var crystals = parseInt($(this).attr('crystals'))
		var price = parseInt($(this).attr('price'))

		if (crystals > 0 && crystals > LW.farmer.crystals) {
			$(this).parent().find('.buy-crystals-button').addClass('disabled')
		} else {
			$(this).parent().find('.buy-crystals-button').removeClass('disabled')
		}

		if (price > LW.farmer.habs) {
			$(this).addClass('disabled')
		} else {
			$(this).removeClass('disabled')
		}

		if (price > LW.farmer.habs && (crystals > 0 && crystals > LW.farmer.crystals)) {
			$('#item-' + $(this).attr('id')).addClass('too-expensive')
		} else {
			$('#item-' + $(this).attr('id')).removeClass('too-expensive')
		}
	})
}

LW.pages.market.selectItem = function(item) {

	var item = $('#market-page .item[name=' + item + ']')

	$('#preview > div').hide()
	$('#preview').find('#' + item.attr('id')).show()

	$('.items div').removeClass('selected')
	item.addClass('selected')
}

LW.pages.market.chips = function(sort_method) {
	var self = this

	var sort_mode = localStorage.getItem('market/sort_mode') == 'type' ? 'type' : 'level';

	// Distributed chips according to their type
	for (var i in LW.EFFECT_TYPES) {
		var type = LW.EFFECT_TYPES[i]
		$('#chips').append('<h3 type="' + type + '">' + _.lang.get('effect', 'effect_type_' + type) + '</h3>')
	}

	var update = function(sort_mode) {
		if (sort_mode == 'type') {
			$('#chips h3').show()
			for (var i in LW.EFFECT_TYPES) {
				var type = LW.EFFECT_TYPES[i]
				$('#chips h3[type="' + type + '"]').appendTo('#chips')
				$('#chips').append('<br>')
				for (var itemID in self.scope.chipsByType[type]) {
					$('#item-' + itemID).appendTo('#chips')
				}
				$('#chips').append('<br>')
			}
			$('#chips-sort-button img').attr('src', LW.staticURL + 'image/icon/grid.png')
		} else if (sort_mode == 'level') {
			$('#chips h3').hide()
			$('#chips br').remove()
			for (var i in self.scope.chips) {
				$('#item-' + self.scope.chips[i].id).appendTo('#chips')
			}
			$('#chips-sort-button img').attr('src', LW.staticURL + 'image/icon/list.png')
		}
		localStorage['market/sort_mode'] = sort_mode
		$('#chips').attr('sort-mode', sort_mode)
	}

	update(sort_mode)

	$('#chips-sort-button').click(function() {
		if (sort_mode === 'type') {
			sort_mode = 'level'
		} else if (sort_mode === 'level') {
			sort_mode = 'type'
		}
		update(sort_mode)
	})
}
